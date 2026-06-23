"""Ingest orchestration: collectors -> filter -> dedupe -> categorize -> persist.

Ingest and translation are *decoupled*: ``run`` persists new items immediately
(with empty zh columns) and returns counts in seconds, then fires translation as
a background task. Translation itself runs several items concurrently (argos /
CTranslate2 releases the GIL inside ``to_thread`` so this uses multiple cores) and
caches identical source strings so a text is only ever translated once per batch.
"""

from __future__ import annotations

import asyncio
import os
from datetime import timedelta

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.collectors.arxiv import collect_arxiv
from app.collectors.base import CollectedItem
from app.collectors.hackernews import collect_hackernews
from app.collectors.rss import collect_rss
from app.core.config import get_settings
from app.core.observability import INGEST_ITEMS, INGEST_RUNS
from app.db import get_sessionmaker
from app.models.base import utcnow
from app.models.feed_item import FeedItem
from app.repositories.feed_item_repo import FeedItemRepository
from app.services.translation.base import get_translator, is_probably_chinese
from app.usecases import categorize as cat

logger = structlog.get_logger(__name__)

# (source attribute on FeedItem, destination zh attribute). Drives both the
# per-item translation in run() and the backfill so the three-field logic lives
# in exactly one place.
FIELDS: tuple[tuple[str, str], ...] = (
    ("title", "title_zh"),
    ("summary", "summary_zh"),
    ("content", "content_zh"),
)


def _translate_concurrency() -> int:
    """How many items to translate at once. CTranslate2 releases the GIL, so a
    handful of worker threads use multiple cores without oversubscribing."""
    return min(4, os.cpu_count() or 2)


# Module-level set keeping a strong reference to fire-and-forget translation
# tasks; asyncio only holds weak refs, so without this they could be GC'd
# mid-flight. Each task removes itself on completion.
_BACKGROUND_TASKS: set[asyncio.Task] = set()


def _spawn_background(coro) -> None:
    task = asyncio.create_task(coro)
    _BACKGROUND_TASKS.add(task)
    task.add_done_callback(_BACKGROUND_TASKS.discard)


class IngestUsecase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = FeedItemRepository(session)

    # --- translation primitives ---------------------------------------------

    async def _translate_text(
        self, text: str | None, target: str, cache: dict[str, str]
    ) -> str | None:
        """Translate a single source string; never raise. Returns None when there
        is nothing to store (blank input). Already-Chinese text is returned as-is.

        A per-batch ``cache`` maps source text -> translated text so identical
        inputs (e.g. arXiv summary == content) are only sent to the engine once.
        """
        if not text or not text.strip():
            return None
        if is_probably_chinese(text):
            return text
        cached = cache.get(text)
        if cached is not None:
            return cached
        try:
            translator = get_translator(get_settings())
            zh = await translator.translate(text, target=target)
            result = zh or ""
        except Exception as exc:  # noqa: BLE001 - one field failing must not fail ingest
            logger.warning("translation_failed", error=str(exc), text_preview=text[:80])
            result = ""
        cache[text] = result
        return result

    async def _translate_into(
        self,
        item: FeedItem,
        src_attr: str,
        zh_attr: str,
        force: bool,
        cache: dict[str, str],
    ) -> bool:
        """Translate ``item.<src_attr>`` into ``item.<zh_attr>``. Returns True iff a
        real (non-empty) translation was filled in.

        Encapsulates the whole per-field policy so run() and backfill share it:
        - source empty               -> write "" sentinel (stops backfill re-match), False
        - already has zh & not force -> no-op, False
        - already Chinese            -> store source verbatim, False (not a fill)
        - otherwise                  -> machine-translate (cached); "" on failure
        """
        src = getattr(item, src_attr)
        if not src or not src.strip():
            if getattr(item, zh_attr) is None:
                setattr(item, zh_attr, "")
            return False
        if not force and getattr(item, zh_attr) is not None:
            return False
        if is_probably_chinese(src):
            setattr(item, zh_attr, src)
            return False
        zh = await self._translate_text(src, target=get_settings().TRANSLATION_TARGET_LANG, cache=cache)
        setattr(item, zh_attr, zh or "")
        return bool(zh)

    async def _translate_item(
        self, item: FeedItem, force: bool, cache: dict[str, str]
    ) -> dict[str, int]:
        """Translate all three fields of one item concurrently. Returns a per-field
        fill count ({"title": 0|1, ...})."""
        results = await asyncio.gather(
            *(
                self._translate_into(item, src, zh, force, cache)
                for src, zh in FIELDS
            )
        )
        return {src: int(filled) for (src, _zh), filled in zip(FIELDS, results)}

    # --- ingest --------------------------------------------------------------

    async def run(self, trigger: str = "manual", window_days: int | None = None) -> dict:
        if window_days is None:
            window_days = get_settings().INGEST_WINDOW_DAYS

        collected: list[CollectedItem] = []
        for collector in (collect_rss, collect_hackernews, collect_arxiv):
            try:
                collected.extend(await collector(window_days))
            except Exception as exc:  # defence-in-depth; collectors guard internally too
                logger.warning("collector_failed", collector=collector.__name__, error=str(exc))

        cutoff = utcnow() - timedelta(days=window_days)

        # Filter to recent window (drop items with no published_at) + dedupe by hash.
        candidates: dict[str, tuple[str, CollectedItem]] = {}  # hash -> (hash, item)
        for item in collected:
            if item.published_at is None or item.published_at < cutoff:
                continue
            if not item.url:
                continue
            h = cat.url_hash(item.url)
            if h not in candidates:
                candidates[h] = (h, item)

        fetched = len(candidates)

        existing = await self._repo.bulk_existing_hashes([h for h in candidates])
        by_source: dict[str, int] = {}
        new_count = 0
        new_ids: list[str] = []

        now = utcnow()
        for h, item in candidates.values():
            if h in existing:
                continue
            category = cat.categorize(item.title, item.summary, item.source_type)
            tags = cat.extract_tags(item.title, item.summary)
            # Persist immediately with empty zh columns; translation is backfilled
            # asynchronously so ingest returns in seconds, not minutes.
            feed_item = FeedItem(
                source_type=item.source_type,
                source_name=item.source_name,
                title=item.title,
                title_zh=None,
                url=cat.normalize_url(item.url),
                url_hash=h,
                summary=item.summary or "",
                summary_zh=None,
                content=item.content,
                content_zh=None,
                author=item.author,
                category=category,
                tags=tags,
                image_url=item.image_url,
                score=item.score,
                published_at=item.published_at,
                fetched_at=now,
            )
            await self._repo.create(feed_item)
            new_count += 1
            new_ids.append(feed_item.id)
            by_source[item.source_name] = by_source.get(item.source_name, 0) + 1

        INGEST_RUNS.labels(trigger).inc()
        INGEST_ITEMS.labels("fetched").inc(fetched)
        INGEST_ITEMS.labels("new").inc(new_count)

        await self._session.commit()
        logger.info("ingest_done", trigger=trigger, fetched=fetched, new=new_count)

        # Fire-and-forget translation in its own session; the caller (POST
        # /ingest/run or the scheduled loop) does not wait for it.
        if new_ids and get_settings().TRANSLATION_ENABLED:
            _spawn_background(self._backfill_ids_in_new_session(new_ids))

        return {"fetched": fetched, "new": new_count, "by_source": by_source}

    async def _backfill_ids_in_new_session(self, ids: list[str]) -> None:
        """Translate the given freshly-ingested rows in a fresh DB session.

        Runs detached from the request; uses its own session so it never touches
        the (already committed / closed) request session.
        """
        try:
            sessionmaker = get_sessionmaker()
            async with sessionmaker() as session:
                await IngestUsecase(session).backfill_translations(ids=ids)
        except Exception as exc:  # noqa: BLE001 - background task must not crash the loop
            logger.error("post_ingest_translation_failed", error=str(exc), count=len(ids))

    # --- backfill ------------------------------------------------------------

    async def backfill_translations(
        self,
        batch_size: int = 50,
        limit: int | None = None,
        force: bool = False,
        ids: list[str] | None = None,
    ) -> dict:
        """Translate stored rows whose zh columns are still empty.

        Idempotent (only touches rows missing a zh value for a non-empty source
        field) and batched (commits every ``batch_size`` rows). ``limit`` caps how
        many rows to process in one call (None = all). ``force=True`` re-translates
        every row, overwriting existing zh values (used after glossary changes); in
        force mode rows are paged by id so the loop always terminates. ``ids``
        restricts the backfill to specific rows (used by the post-ingest task).

        Within a batch, items are translated concurrently (bounded by a semaphore)
        and identical source texts are translated only once via a shared cache.
        """
        processed = 0
        filled = {"title": 0, "summary": 0, "content": 0}
        offset = 0
        sem = asyncio.Semaphore(_translate_concurrency())

        async def _guarded(item: FeedItem, cache: dict[str, str]) -> dict[str, int]:
            async with sem:
                return await self._translate_item(item, force=force, cache=cache)

        while True:
            if ids is not None:
                rows = await self._repo.list_by_ids(ids[offset : offset + batch_size])
                offset += batch_size
            elif force:
                rows = await self._repo.list_all_for_retranslation(batch_size, offset)
                offset += len(rows)
            else:
                rows = await self._repo.list_missing_translations(batch_size)
            if not rows:
                break
            if limit is not None:
                rows = rows[: max(0, limit - processed)]
                if not rows:
                    break

            # One cache per batch: dedupes identical source strings (e.g. arXiv
            # summary == content) so each unique text hits the engine once.
            cache: dict[str, str] = {}
            per_item = await asyncio.gather(*(_guarded(item, cache) for item in rows))
            for counts in per_item:
                for key, n in counts.items():
                    filled[key] += n
            processed += len(rows)

            await self._session.commit()
            logger.info(
                "backfill_batch",
                processed=processed,
                title_filled=filled["title"],
                summary_filled=filled["summary"],
                content_filled=filled["content"],
            )
            if limit is not None and processed >= limit:
                break

        return {
            "processed": processed,
            "title_filled": filled["title"],
            "summary_filled": filled["summary"],
            "content_filled": filled["content"],
        }
