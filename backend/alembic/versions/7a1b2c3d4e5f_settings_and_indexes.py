"""app_settings table + performance indexes

Revision ID: 7a1b2c3d4e5f
Revises: 49e7c4633b4a
Create Date: 2026-10-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "7a1b2c3d4e5f"
down_revision: Union[str, None] = "49e7c4633b4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    # Indexes to speed up the common transaction queries (sort by risk, filter by status).
    op.create_index("ix_transactions_risk_score", "transactions", ["risk_score"])
    op.create_index("ix_transactions_review_status", "transactions", ["review_status"])
    op.create_index("ix_transactions_risk_band", "transactions", ["risk_band"])
    op.create_index(
        "ix_audit_events_entity", "audit_events", ["entity_type", "entity_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_audit_events_entity", table_name="audit_events")
    op.drop_index("ix_transactions_risk_band", table_name="transactions")
    op.drop_index("ix_transactions_review_status", table_name="transactions")
    op.drop_index("ix_transactions_risk_score", table_name="transactions")
    op.drop_table("app_settings")
