"""CLI entrypoint: re-enrich stored feed items with the configured LLM.

Usage (inside the container / venv):

    python -m app.llm_backfill              # enrich rows still missing zh
    python -m app.llm_backfill --limit 50   # cap the number of rows
    python -m app.llm_backfill --force      # re-enrich ALL rows (overwrite zh + reason)

Unlike ``app.translate_backfill`` (offline argostranslate), this drives the LLM
content-enhancement path: fluent zh translations plus an AIHOT-style ``reason_zh``.
It reuses ``IngestUsecase.backfill_translations``, which automatically takes the
LLM route whenever the LLM is effectively enabled; per-item LLM failures fall back
to argostranslate so the run never aborts mid-batch.

Exits with a friendly error when the LLM is not configured (so this command is a
no-op surprise rather than a silent argostranslate run).
"""

from __future__ import annotations

import argparse
import asyncio
import sys

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
    parser = argparse.ArgumentParser(
        description="Re-enrich feed items with the configured LLM (zh + reason_zh)."
    )
    parser.add_argument("--batch-size", type=int, default=50, help="rows committed per batch")
    parser.add_argument("--limit", type=int, default=None, help="max rows to process (default: all)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="re-enrich ALL rows, overwriting existing zh values and reason_zh",
    )
    args = parser.parse_args()

    configure_logging(get_settings().LOG_LEVEL)

    settings = get_settings()
    if not settings.llm_effective_enabled:
        print(
            "LLM is not configured: set LLM_ENABLED=true and fill LLM_BASE_URL / "
            "LLM_API_KEY / LLM_MODEL in .env, then re-run. "
            "(For offline argostranslate re-translation use: python -m app.translate_backfill)",
            file=sys.stderr,
        )
        raise SystemExit(2)

    result = asyncio.run(_run(args.batch_size, args.limit, args.force))
    logger.info("llm_backfill_done", **result)
    print(
        f"LLM backfill complete: processed={result['processed']} "
        f"title_filled={result['title_filled']} summary_filled={result['summary_filled']} "
        f"content_filled={result['content_filled']}"
    )


if __name__ == "__main__":
    main()
