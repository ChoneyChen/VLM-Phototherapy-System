from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.infrastructure.db.models import (
    SkinAssessmentModel,
    TreatmentPlanModel,
    TreatmentRecordModel,
    UserModel,
    ZoneObservationModel,
)


class UserRepository:
    @staticmethod
    def build_public_id(sequence_number: int) -> str:
        return f"USR-{sequence_number:04d}"

    def list_users(self, db: Session) -> list[UserModel]:
        return list(db.scalars(select(UserModel).order_by(UserModel.sequence_number.asc())))

    def get_by_public_id(self, db: Session, user_public_id: str) -> UserModel | None:
        return db.scalar(select(UserModel).where(UserModel.public_id == user_public_id))

    def create(self, db: Session, name: str, notes: str | None) -> UserModel:
        next_sequence = (db.scalar(select(func.max(UserModel.sequence_number))) or 0) + 1
        user = UserModel(
            sequence_number=next_sequence,
            public_id=self.build_public_id(next_sequence),
            name=name,
            notes=notes,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def delete_by_public_id(self, db: Session, user_public_id: str) -> bool:
        user = self.get_by_public_id(db=db, user_public_id=user_public_id)
        if user is None:
            return False

        db.delete(user)
        db.commit()
        return True


class AssessmentRepository:
    def create_assessment(
        self,
        db: Session,
        assessment_id: str,
        user: UserModel,
        provider: str,
        image_path: str,
        payload: dict,
    ) -> SkinAssessmentModel:
        record = SkinAssessmentModel(
            assessment_id=assessment_id,
            user_id=user.id,
            model_provider=provider,
            overall_condition=payload["overall_condition_texts"][payload["analysis_language"]],
            overall_severity=payload["overall_severity"],
            overall_summary=payload["overall_summary_texts"][payload["analysis_language"]],
            image_path=image_path,
            raw_payload=payload,
        )
        db.add(record)
        db.flush()

        for index, zone in enumerate(payload["zones"]):
            treatment = zone["treatment_plan"]
            db.add(
                ZoneObservationModel(
                    assessment_id=assessment_id,
                    display_order=index,
                    zone_name=zone["zone_name"],
                    issue_category=zone["issue_category_code"],
                    severity=zone["severity"],
                    summary=zone["summary_texts"][payload["analysis_language"]],
                    treatment_light_type=treatment["light_type_code"],
                    treatment_temperature_celsius=treatment["temperature_celsius"],
                    treatment_duration_minutes=treatment["duration_minutes"],
                    treatment_humidification=treatment["humidification_enabled"],
                    treatment_notes=treatment["notes_texts"][payload["analysis_language"]],
                )
            )

        db.commit()
        return self.get_by_id(db=db, assessment_id=assessment_id)  # type: ignore[return-value]

    def list_for_user(self, db: Session, user_id: int, limit: int) -> list[SkinAssessmentModel]:
        statement = (
            select(SkinAssessmentModel)
            .where(SkinAssessmentModel.user_id == user_id)
            .options(joinedload(SkinAssessmentModel.user))
            .order_by(SkinAssessmentModel.captured_at.desc())
            .limit(limit)
        )
        return list(db.scalars(statement).unique())

    def get_by_id(self, db: Session, assessment_id: str) -> SkinAssessmentModel | None:
        statement = (
            select(SkinAssessmentModel)
            .where(SkinAssessmentModel.assessment_id == assessment_id)
            .options(
                joinedload(SkinAssessmentModel.user),
                joinedload(SkinAssessmentModel.zones),
            )
        )
        return db.scalar(statement)

    def delete_by_id(self, db: Session, assessment_id: str) -> SkinAssessmentModel | None:
        record = self.get_by_id(db=db, assessment_id=assessment_id)
        if record is None:
            return None

        db.delete(record)
        db.commit()
        return record


class TreatmentPlanRepository:
    def create_plan(
        self,
        db: Session,
        *,
        plan_id: str,
        user: UserModel,
        assessment: SkinAssessmentModel,
        model_provider: str,
        payload: dict,
    ) -> TreatmentPlanModel:
        record = TreatmentPlanModel(
            plan_id=plan_id,
            user_id=user.id,
            assessment_id=assessment.assessment_id,
            model_provider=model_provider,
            overall_severity=payload["overall_severity"],
            plan_summary=payload["summary_texts"]["en"],
            raw_payload=payload,
        )
        db.add(record)
        db.commit()
        return self.get_by_id(db=db, plan_id=plan_id)  # type: ignore[return-value]

    def list_for_user(self, db: Session, user_id: int, limit: int) -> list[TreatmentPlanModel]:
        statement = (
            select(TreatmentPlanModel)
            .where(TreatmentPlanModel.user_id == user_id)
            .options(
                joinedload(TreatmentPlanModel.user),
                joinedload(TreatmentPlanModel.assessment),
            )
            .order_by(TreatmentPlanModel.created_at.desc())
            .limit(limit)
        )
        return list(db.scalars(statement).unique())

    def get_by_id(self, db: Session, plan_id: str) -> TreatmentPlanModel | None:
        statement = (
            select(TreatmentPlanModel)
            .where(TreatmentPlanModel.plan_id == plan_id)
            .options(
                joinedload(TreatmentPlanModel.user),
                joinedload(TreatmentPlanModel.assessment),
                joinedload(TreatmentPlanModel.treatment_records),
            )
        )
        return db.scalar(statement)


class TreatmentRecordRepository:
    def create_record(
        self,
        db: Session,
        *,
        record_id: str,
        user: UserModel,
        treatment_plan: TreatmentPlanModel,
        status: str,
        timer_minutes: int,
        payload: dict,
    ) -> TreatmentRecordModel:
        record = TreatmentRecordModel(
            record_id=record_id,
            user_id=user.id,
            treatment_plan_id=treatment_plan.plan_id,
            status=status,
            timer_minutes=timer_minutes,
            raw_payload=payload,
        )
        db.add(record)
        db.commit()
        return self.get_by_id(db=db, record_id=record_id)  # type: ignore[return-value]

    def list_for_user(self, db: Session, user_id: int, limit: int) -> list[TreatmentRecordModel]:
        statement = (
            select(TreatmentRecordModel)
            .where(TreatmentRecordModel.user_id == user_id)
            .options(
                joinedload(TreatmentRecordModel.user),
                joinedload(TreatmentRecordModel.treatment_plan),
            )
            .order_by(TreatmentRecordModel.created_at.desc())
            .limit(limit)
        )
        return list(db.scalars(statement).unique())

    def get_by_id(self, db: Session, record_id: str) -> TreatmentRecordModel | None:
        statement = (
            select(TreatmentRecordModel)
            .where(TreatmentRecordModel.record_id == record_id)
            .options(
                joinedload(TreatmentRecordModel.user),
                joinedload(TreatmentRecordModel.treatment_plan),
            )
        )
        return db.scalar(statement)

    def update_status(self, db: Session, record_id: str, status: str) -> TreatmentRecordModel | None:
        record = self.get_by_id(db=db, record_id=record_id)
        if record is None:
            return None
        record.status = status
        db.commit()
        return self.get_by_id(db=db, record_id=record_id)
