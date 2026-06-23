"""feed_items: add content + content_zh (source-provided full article body)

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-23

Additive, backward-compatible: two nullable Text columns. ``content`` holds the
cleaned full body the source itself published (RSS content:encoded / content /
summary, arXiv abstract); ``content_zh`` holds its Chinese translation. HN items
carry no body, so both stay NULL for them. title / summary / *_zh are unchanged.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feed_items", sa.Column("content", sa.Text(), nullable=True))
    op.add_column("feed_items", sa.Column("content_zh", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("feed_items", "content_zh")
    op.drop_column("feed_items", "content")
