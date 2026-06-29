"""feed_items: add reason_zh (editorial "why this matters" blurb)

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-29

Additive, backward-compatible: one nullable Text column. ``reason_zh`` holds the
"推荐理由" blurb, split out of ``content_zh`` so the frontend can render a
dedicated 精选理由 box separate from the summary box. Backfilled from existing
content_zh by ``python -m app.split_reason``; new items leave it NULL.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feed_items", sa.Column("reason_zh", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("feed_items", "reason_zh")
