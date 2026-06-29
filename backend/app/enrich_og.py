"""One-off backfill: give existing link-only items an og:description summary.

Hacker News (and some RSS) rows are bare links — ``summary=""`` and
``content IS NULL`` — so in the feed they show only a title and an "原文" link.
This walks those rows, fetches each linked page's OWN ``<head>`` metadata
(``og:description`` for a one-line summary, ``og:image`` for a thumbnail when
missing), writes ``summary`` and resets ``summary_zh`` to NULL, then runs the
ordinary translation backfill so the new summaries get a ``summary_zh``.

It reads only the page's self-declared meta (never body text); the original link
and source attribution are untouched. Polite by config: declared UA, short
timeout, capped read size, HTML-only.

Run inside the container / venv::

    python -m app.enrich_og

Idempotent (an item that already has a summary is skipped) and safe to re-run /
interrupt (batched commits). A page that exposes no usable metadata simply stays
a link-only card.
"""

from __future__ import annotations

import asyncio

import structlog

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db import dispose_engine, get_sessionmaker, init_engine
from app.usecases.ingest_usecase import IngestUsecase

logger = structlog.get_logger(__name__)


async def _run() -> dict:
    settings = get_settings()
    init_engine(settings)
    try:
        sessionmaker = get_sessionmaker()
        async with sessionmaker() as session:
            usecase = IngestUsecase(session)
            enrich = await usecase.enrich_link_summaries()
            # Translate the freshly-filled summaries (and anything else still
            # missing a zh value). Idempotent; only touches NULL zh columns.
            translate = await usecase.backfill_translations()
        return {
            "enrich_processed": enrich["processed"],
            "enriched": enrich["enriched"],
            "translate_processed": translate["processed"],
            "summary_translated": translate["summary_filled"],
        }
    finally:
        await dispose_engine()


def main() -> None:
    configure_logging(get_settings().LOG_LEVEL)
    result = asyncio.run(_run())
    logger.info("enrich_og_done", **result)
    print(
        f"OG enrichment complete: enriched={result['enriched']}/"
        f"{result['enrich_processed']} link-only items; "
        f"summary_zh filled for {result['summary_translated']} rows "
        f"(translated {result['translate_processed']})."
    )


if __name__ == "__main__":
    main()
