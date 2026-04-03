import uuid

from sqlalchemy.orm import Session

from app.domain.catalog import TREATMENT_RECORD_STATUSES
from app.infrastructure.db.models import TreatmentPlanModel, TreatmentRecordModel
from app.infrastructure.db.repositories import TreatmentPlanRepository, TreatmentRecordRepository, UserRepository
from app.schemas.assessment import LocalizedText
from app.schemas.control import GlobalMaskSettings, ZoneLedSetting
from app.schemas.treatment_record import TreatmentRecordCreate, TreatmentRecordRead


class TreatmentRecordService:
    def __init__(
        self,
        user_repository: UserRepository,
        treatment_plan_repository: TreatmentPlanRepository,
        treatment_record_repository: TreatmentRecordRepository,
    ) -> None:
        self.user_repository = user_repository
        self.treatment_plan_repository = treatment_plan_repository
        self.treatment_record_repository = treatment_record_repository

    def list_user_records(self, db: Session, *, user_public_id: str, limit: int = 30) -> list[TreatmentRecordRead]:
        user = self.user_repository.get_by_public_id(db=db, user_public_id=user_public_id)
        if user is None:
            raise LookupError(f"User '{user_public_id}' does not exist.")

        records = self.treatment_record_repository.list_for_user(db=db, user_id=user.id, limit=limit)
        return [self._to_read(record) for record in records]

    def create_record(self, db: Session, *, payload: TreatmentRecordCreate) -> TreatmentRecordRead:
        plan = self.treatment_plan_repository.get_by_id(db=db, plan_id=payload.treatment_plan_id)
        if plan is None:
            raise LookupError("Treatment plan not found.")

        normalized_payload = self._normalize_record_payload(plan=plan, payload=payload)
        record = self.treatment_record_repository.create_record(
            db=db,
            record_id=f"REC-{uuid.uuid4().hex[:12]}",
            user=plan.user,
            treatment_plan=plan,
            status="running",
            timer_minutes=normalized_payload["global_settings"]["timer_minutes"],
            payload=normalized_payload,
        )
        return self._to_read(record)

    def update_status(self, db: Session, *, record_id: str, status: str) -> TreatmentRecordRead | None:
        if status not in TREATMENT_RECORD_STATUSES:
            raise ValueError("Unsupported treatment record status.")

        record = self.treatment_record_repository.update_status(db=db, record_id=record_id, status=status)
        if record is None:
            return None
        return self._to_read(record)

    def _normalize_record_payload(self, *, plan: TreatmentPlanModel, payload: TreatmentRecordCreate) -> dict:
        plan_payload = plan.raw_payload or {}
        plan_zone_settings = {
            zone["zone_name"]: zone
            for zone in plan_payload.get("zone_recommendations", [])
            if isinstance(zone, dict)
        }
        request_zone_settings = {
            zone.zone_name: zone
            for zone in payload.zone_led_settings
        }

        normalized_zones = []
        for zone_name, plan_zone in plan_zone_settings.items():
            request_zone = request_zone_settings.get(zone_name)
            normalized_zones.append(
                {
                    "zone_name": zone_name,
                    "issue_category_code": plan_zone.get("issue_category_code", "insufficient_data"),
                    "severity": plan_zone.get("severity", "medium"),
                    "led_color_code": (
                        request_zone.led_color_code if request_zone is not None else plan_zone.get("led_color_code", "yellow")
                    ),
                }
            )

        return {
            "plan_summary_texts": plan_payload.get("summary_texts"),
            "overall_severity": plan_payload.get("overall_severity", plan.overall_severity),
            "global_settings": payload.global_settings.model_dump(),
            "zone_led_settings": normalized_zones,
        }

    def _to_read(self, model: TreatmentRecordModel) -> TreatmentRecordRead:
        payload = model.raw_payload or {}
        return TreatmentRecordRead(
            id=model.record_id,
            user_public_id=model.user.public_id,
            treatment_plan_id=model.treatment_plan_id,
            plan_summary_texts=LocalizedText.model_validate(payload.get("plan_summary_texts")),
            overall_severity=payload.get("overall_severity", "medium"),
            status=model.status,
            timer_minutes=model.timer_minutes,
            created_at=model.created_at,
            updated_at=model.updated_at,
            global_settings=GlobalMaskSettings.model_validate(payload.get("global_settings")),
            zone_led_settings=[
                ZoneLedSetting.model_validate(zone)
                for zone in payload.get("zone_led_settings", [])
            ],
        )
