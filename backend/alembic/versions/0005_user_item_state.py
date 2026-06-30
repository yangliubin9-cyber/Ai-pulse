"""user_item_states: per-user saved/read flags

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_item_states",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("item_id", sa.String(length=36), nullable=False),
        sa.Column("saved", sa.Boolean(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "item_id", name="uq_user_item_state"),
    )
    op.create_index(
        "ix_user_item_states_user_saved", "user_item_states", ["user_id", "saved"]
    )
    op.create_index(
        "ix_user_item_states_user_read", "user_item_states", ["user_id", "read"]
    )


def downgrade() -> None:
    op.drop_index("ix_user_item_states_user_read", table_name="user_item_states")
    op.drop_index("ix_user_item_states_user_saved", table_name="user_item_states")
    op.drop_table("user_item_states")
