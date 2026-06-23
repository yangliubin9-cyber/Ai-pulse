"""CLI entrypoint: backfill zh translations for already-stored feed items.

Usage (inside the container / venv):

    python -m app.translate_backfill            # translate all rows missing zh
    python -m app.translate_backfill --limit 50 # cap the number of rows
    python -m app.translate_backfill --force    # re-translate ALL rows (overwrite)

Idempotent by default: only rows whose title_zh / summary_zh is still NULL are
touched. With ``--force`` every row is re-translated and existing zh values are
overwritten (use after improving the glossary / term-protection layer).
Safe to re-run; safe to interrupt (each batch is committed).
"""

from __future__ import annotations

import argparse
import asyncio

import structlog

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db import dispose_engine, get_sessionmaker, init_engine
from app.usecases.ingest_usecase import IngestUsecase

logger = structlog.get_logger(__name__)


async def _run(batch_size: int, limit: int | None, force: bool) -> dict:
    settings = get_settings()
    init_engine(settings)
    try:
        sessionmaker = get_sessionmaker()
        async with sessionmaker() as session:
            result = await IngestUsecase(session).backfill_translations(
                batch_size=batch_size, limit=limit, force=force
            )
        return result
    finally:
        await dispose_engine()


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill zh translations for feed items.")
    parser.add_argument("--batch-size", type=int, default=50, help="rows committed per batch")
    parser.add_argument("--limit", type=int, default=None, help="max rows to process (default: all)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="re-translate ALL rows, overwriting existing title_zh / summary_zh",
    )
    args = parser.parse_args()

    configure_logging(get_settings().LOG_LEVEL)
    result = asyncio.run(_run(args.batch_size, args.limit, args.force))
    logger.info("backfill_done", **result)
    print(
        f"Backfill complete: processed={result['processed']} "
        f"title_filled={result['title_filled']} summary_filled={result['summary_filled']} "
        f"content_filled={result['content_filled']}"
    )


if __name__ == "__main__":
    main()
