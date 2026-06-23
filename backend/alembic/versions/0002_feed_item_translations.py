"""feed_items: add title_zh + summary_zh (offline en->zh translation)

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-23

Additive, backward-compatible: two nullable Text columns holding the Chinese
translation of title / summary. Original English title/summary are kept.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feed_items", sa.Column("title_zh", sa.Text(), nullable=True))
    op.add_column("feed_items", sa.Column("summary_zh", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("feed_items", "summary_zh")
    op.drop_column("feed_items", "title_zh")
