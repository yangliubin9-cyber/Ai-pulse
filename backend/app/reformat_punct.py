"""One-off backfill: re-typeset existing zh columns to full-width punctuation.

Older rows were machine-translated before ``normalize_cjk_punct`` existed, so
their ``title_zh`` / ``summary_zh`` / ``content_zh`` / ``reason_zh`` still carry
half-width ASCII punctuation (``,`` ``.`` ``:`` ...) wedged inside Chinese. This
script walks every row and re-applies the same typesetting pipeline used at
translation time -- ``normalize_cjk_punct`` (ASCII -> full-width in Chinese
context, with digit / URL guards) then ``tidy_cjk`` (whitespace) -- and writes
the result back.

It **only re-typesets, never re-translates**: no MT engine is touched, no source
text is read, only the existing Chinese strings are reformatted. Numbers, URLs
and English-only spans are left untouched by the guards in ``normalize_cjk_punct``.

Run inside the container / venv::

    python -m app.reformat_punct

Idempotent: a string already in full-width form is unchanged by the pipeline, so
only rows whose reformatted value actually differs are written. Safe to re-run,
safe to interrupt (batched commits).
"""

from __future__ import annotations

import asyncio

import structlog
from sqlalchemy import or_, select

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db import dispose_engine, get_sessionmaker, init_engine
from app.models.feed_item import FeedItem
from app.services.translation.format import normalize_cjk_punct, tidy_cjk

logger = structlog.get_logger(__name__)

# zh columns to reformat.
_FIELDS: tuple[str, ...] = ("title_zh", "summary_zh", "content_zh", "reason_zh")


def reformat(text: str | None) -> str | None:
    """Apply the full typesetting pipeline (normalize punct -> tidy whitespace).

    Pure function. Returns the input unchanged for falsy input. Mirrors exactly
    what ``local._translate_sync`` now does at translation time so re-running the
    backfill and translating fresh produce the same shape.
    """
    if not text:
        return text
    return tidy_cjk(normalize_cjk_punct(text))


async def _run(batch_size: int = 200) -> dict:
    settings = get_settings()
    init_engine(settings)
    processed = 0
    updated = 0
    fields_changed = 0
    try:
        sessionmaker = get_sessionmaker()
        async with sessionmaker() as session:
            # Any row with at least one non-null zh column is a candidate.
            conds = [getattr(FeedItem, f).isnot(None) for f in _FIELDS]
            stmt = select(FeedItem).where(or_(*conds))
            rows = list((await session.execute(stmt)).scalars().all())
            for item in rows:
                processed += 1
                row_changed = False
                for field in _FIELDS:
                    current = getattr(item, field)
                    new_value = reformat(current)
                    if new_value != current:
                        setattr(item, field, new_value)
                        fields_changed += 1
                        row_changed = True
                if row_changed:
                    updated += 1
                    if updated % batch_size == 0:
                        await session.commit()
            await session.commit()
        return {
            "processed": processed,
            "updated": updated,
            "fields_changed": fields_changed,
        }
    finally:
        await dispose_engine()


def main() -> None:
    configure_logging(get_settings().LOG_LEVEL)
    result = asyncio.run(_run())
    logger.info("reformat_punct_done", **result)
    print(
        f"Reformat punct complete: processed={result['processed']} "
        f"updated={result['updated']} fields_changed={result['fields_changed']}"
    )


if __name__ == "__main__":
    main()
