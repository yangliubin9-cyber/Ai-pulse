"""One-off backfill: split the "推荐理由" blurb out of content_zh into reason_zh.

Earlier items had their Chinese body written as::

    <摘要正文>

    推荐理由：<理由文本>

We now keep the body in ``content_zh`` and the editorial blurb in its own
``reason_zh`` column so the frontend can render a "精选理由框 + 摘要框" two-box
layout. This script walks every row whose ``content_zh`` still contains the
"推荐理由：" marker and rewrites the two columns.

Run inside the container / venv::

    python -m app.split_reason

Idempotent: rows already split (no "推荐理由：" marker left in content_zh) are
skipped, so it is safe to re-run and safe to interrupt (batched commits).
"""

from __future__ import annotations

import asyncio

import structlog
from sqlalchemy import or_, select

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db import dispose_engine, get_sessionmaker, init_engine
from app.models.feed_item import FeedItem

logger = structlog.get_logger(__name__)

# Marker introducing the editorial blurb. The Chinese full-width colon is the
# canonical form; the ASCII colon is accepted as a fallback for items written
# with a half-width colon. Order matters: try the full-width marker first.
_MARKERS: tuple[str, ...] = ("推荐理由：", "推荐理由:")


def split_reason(content_zh: str | None) -> tuple[str | None, str | None]:
    """Split a Chinese body into ``(body, reason)``.

    - If ``content_zh`` contains a "推荐理由：" (or half-width "推荐理由:") marker,
      everything after the *first* marker is the reason (stripped) and everything
      before it is the body (trailing whitespace/blank lines stripped).
    - If no marker is present, returns ``(content_zh, None)`` unchanged so the
      body is left exactly as-is and no reason is produced.
    - ``None`` / empty input returns ``(content_zh, None)`` untouched.

    Pure function (no I/O); the marker text inside the reason (e.g. markdown
    bold ``**...**``) is preserved verbatim.
    """
    if not content_zh:
        return content_zh, None

    for marker in _MARKERS:
        idx = content_zh.find(marker)
        if idx != -1:
            body = content_zh[:idx].rstrip()
            reason = content_zh[idx + len(marker):].strip()
            return body, reason

    return content_zh, None


async def _run(batch_size: int = 200) -> dict:
    settings = get_settings()
    init_engine(settings)
    processed = 0
    updated = 0
    try:
        sessionmaker = get_sessionmaker()
        async with sessionmaker() as session:
            # Only rows whose content_zh still carries a marker need splitting.
            # Already-split rows (no marker left) never match -> idempotent.
            conds = [FeedItem.content_zh.contains(m) for m in _MARKERS]
            stmt = select(FeedItem).where(
                FeedItem.content_zh.isnot(None), or_(*conds)
            )
            rows = list((await session.execute(stmt)).scalars().all())
            for item in rows:
                processed += 1
                body, reason = split_reason(item.content_zh)
                if reason is None:
                    continue
                item.content_zh = body
                item.reason_zh = reason
                updated += 1
                if updated % batch_size == 0:
                    await session.commit()
            await session.commit()
        return {"processed": processed, "updated": updated}
    finally:
        await dispose_engine()


def main() -> None:
    configure_logging(get_settings().LOG_LEVEL)
    result = asyncio.run(_run())
    logger.info("split_reason_done", **result)
    print(
        f"Split reason complete: processed={result['processed']} "
        f"updated={result['updated']}"
    )


if __name__ == "__main__":
    main()
