"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2024-12-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", postgresql.ENUM("admin", "agent", "viewer", name="userrole"), nullable=False, server_default="agent"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("phone", sa.String(30)),
        sa.Column("whatsapp", sa.String(30)),
        sa.Column("notify_on_log", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(30)),
        sa.Column("whatsapp", sa.String(30)),
        sa.Column("status", postgresql.ENUM("new_lead", "in_progress", "application_submitted", "visa_processing", "enrolled", "not_qualified", "lost", name="contactstatus"), nullable=False, server_default="new_lead"),
        sa.Column("destination_country", postgresql.ENUM("United Kingdom", "Canada", "USA", "Australia", "Malaysia", "Germany", "Denmark", "UAE", "Multiple", "Undecided", name="destinationcountry"), server_default="Undecided"),
        sa.Column("program_interest", sa.String(300)),
        sa.Column("university_interest", sa.String(300)),
        sa.Column("source", sa.String(100)),
        sa.Column("notes", sa.Text()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contacts_id", "contacts", ["id"])
    op.create_index("ix_contacts_full_name", "contacts", ["full_name"])
    op.create_index("ix_contacts_email", "contacts", ["email"])

    op.create_table(
        "interactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=False),
        sa.Column("logged_by", sa.Integer(), nullable=False),
        sa.Column("type", postgresql.ENUM("call", "chat", "meeting", "email", "whatsapp", name="interactiontype"), nullable=False),
        sa.Column("topic", postgresql.ENUM("University Selection", "Visa Application", "Application Process", "SOP / CV Writing", "Scholarship Information", "Tuition & Fees", "Accommodation", "Career Counseling", "English Language Test", "Interview Preparation", "General Enquiry", "Follow-up", name="interactiontopic"), server_default="General Enquiry"),
        sa.Column("duration_minutes", sa.Integer()),
        sa.Column("raw_notes", sa.Text()),
        sa.Column("ai_summary", sa.Text()),
        sa.Column("ai_transcript", sa.Text()),
        sa.Column("follow_up_action", sa.Text()),
        sa.Column("follow_up_due", sa.DateTime(timezone=True)),
        sa.Column("follow_up_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notification_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("shared_token", sa.String(64)),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["logged_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_interactions_id", "interactions", ["id"])
    op.create_index("ix_interactions_shared_token", "interactions", ["shared_token"], unique=True)


def downgrade() -> None:
    op.drop_table("interactions")
    op.drop_table("contacts")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS interactiontype")
    op.execute("DROP TYPE IF EXISTS interactiontopic")
    op.execute("DROP TYPE IF EXISTS contactstatus")
    op.execute("DROP TYPE IF EXISTS destinationcountry")
    op.execute("DROP TYPE IF EXISTS userrole")
