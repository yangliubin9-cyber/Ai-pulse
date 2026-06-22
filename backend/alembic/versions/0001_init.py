"""init: feed_items + users

Revision ID: 0001
Revises:
Create Date: 2026-06-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "feed_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_type", sa.String(length=16), nullable=False),
        sa.Column("source_name", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("url", sa.String(length=1024), nullable=False),
        sa.Column("url_hash", sa.String(length=64), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("author", sa.String(length=256), nullable=True),
        sa.Column("category", sa.String(length=16), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("image_url", sa.String(length=1024), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url_hash"),
    )
    op.create_index("ix_feed_items_source_type", "feed_items", ["source_type"])
    op.create_index("ix_feed_items_source_name", "feed_items", ["source_name"])
    op.create_index("ix_feed_items_category", "feed_items", ["category"])
    op.create_index("ix_feed_items_published_at", "feed_items", ["published_at"])
    op.create_index(
        "ix_feed_items_category_published", "feed_items", ["category", "published_at"]
    )
    op.create_index(
        "ix_feed_items_source_published", "feed_items", ["source_type", "published_at"]
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=160), nullable=False),
        sa.Column("password_salt", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_index("ix_feed_items_source_published", table_name="feed_items")
    op.drop_index("ix_feed_items_category_published", table_name="feed_items")
    op.drop_index("ix_feed_items_published_at", table_name="feed_items")
    op.drop_index("ix_feed_items_category", table_name="feed_items")
    op.drop_index("ix_feed_items_source_name", table_name="feed_items")
    op.drop_index("ix_feed_items_source_type", table_name="feed_items")
    op.drop_table("feed_items")
