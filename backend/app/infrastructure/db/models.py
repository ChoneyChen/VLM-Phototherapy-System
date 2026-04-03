from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sequence_number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    assessments: Mapped[list["SkinAssessmentModel"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    treatment_plans: Mapped[list["TreatmentPlanModel"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    treatment_records: Mapped[list["TreatmentRecordModel"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class SkinAssessmentModel(Base):
    __tablename__ = "skin_assessments"

    assessment_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    model_provider: Mapped[str] = mapped_column(String(16), nullable=False)
    overall_condition: Mapped[str] = mapped_column(String(200), nullable=False)
    overall_severity: Mapped[str] = mapped_column(String(16), nullable=False)
    overall_summary: Mapped[str] = mapped_column(Text, nullable=False)
    image_path: Mapped[str] = mapped_column(String(400), nullable=False)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)

    user: Mapped[UserModel] = relationship(back_populates="assessments")
    zones: Mapped[list["ZoneObservationModel"]] = relationship(
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="ZoneObservationModel.display_order",
    )
    treatment_plans: Mapped[list["TreatmentPlanModel"]] = relationship(
        back_populates="assessment",
        cascade="all, delete-orphan",
    )


class ZoneObservationModel(Base):
    __tablename__ = "zone_observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assessment_id: Mapped[str] = mapped_column(ForeignKey("skin_assessments.assessment_id"), nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    zone_name: Mapped[str] = mapped_column(String(64), nullable=False)
    issue_category: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    treatment_light_type: Mapped[str] = mapped_column(String(32), nullable=False)
    treatment_temperature_celsius: Mapped[int] = mapped_column(Integer, nullable=False)
    treatment_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    treatment_humidification: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    treatment_notes: Mapped[str] = mapped_column(Text, nullable=False)

    assessment: Mapped[SkinAssessmentModel] = relationship(back_populates="zones")


class TreatmentPlanModel(Base):
    __tablename__ = "treatment_plans"

    plan_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    assessment_id: Mapped[str] = mapped_column(ForeignKey("skin_assessments.assessment_id"), nullable=False, index=True)
    model_provider: Mapped[str] = mapped_column(String(32), nullable=False)
    overall_severity: Mapped[str] = mapped_column(String(16), nullable=False)
    plan_summary: Mapped[str] = mapped_column(Text, nullable=False)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)

    user: Mapped[UserModel] = relationship(back_populates="treatment_plans")
    assessment: Mapped[SkinAssessmentModel] = relationship(back_populates="treatment_plans")
    treatment_records: Mapped[list["TreatmentRecordModel"]] = relationship(
        back_populates="treatment_plan",
        cascade="all, delete-orphan",
    )


class TreatmentRecordModel(Base):
    __tablename__ = "treatment_records"

    record_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    treatment_plan_id: Mapped[str] = mapped_column(ForeignKey("treatment_plans.plan_id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    timer_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user: Mapped[UserModel] = relationship(back_populates="treatment_records")
    treatment_plan: Mapped[TreatmentPlanModel] = relationship(back_populates="treatment_records")
