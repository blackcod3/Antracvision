"""Add image_url and soft-delete flag to detections."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_detections_image_active"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("detections", sa.Column("image_url", sa.String(length=512), nullable=True))
    op.add_column(
        "detections",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_detections_is_active", "detections", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_detections_is_active", table_name="detections")
    op.drop_column("detections", "is_active")
    op.drop_column("detections", "image_url")
