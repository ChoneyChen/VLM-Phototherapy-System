from sqlalchemy.orm import Session

from app.domain.catalog import (
    CONTROL_BRIGHTNESS_RANGE,
    CONTROL_HUMIDIFICATION_FREQUENCY_RANGE,
    CONTROL_TEMPERATURE_RANGE,
    CONTROL_TIMER_RANGE,
    LIGHT_COLOR_CODES,
    ZONE_ORDER,
)
from app.infrastructure.db.repositories import TreatmentPlanRepository
from app.schemas.assessment import LocalizedText
from app.schemas.control import (
    GlobalMaskSettings,
    NumericControlOption,
    TreatmentControlOptionsResponse,
    TreatmentControlSessionResponse,
    ZoneLedSetting,
)


class TreatmentControlService:
    def __init__(self, treatment_plan_repository: TreatmentPlanRepository) -> None:
        self.treatment_plan_repository = treatment_plan_repository

    def get_control_options(self) -> TreatmentControlOptionsResponse:
        return TreatmentControlOptionsResponse(
            mask_zone_codes=ZONE_ORDER,
            light_color_codes=LIGHT_COLOR_CODES,
            brightness_percent=NumericControlOption(**CONTROL_BRIGHTNESS_RANGE),
            temperature_celsius=NumericControlOption(**CONTROL_TEMPERATURE_RANGE),
            humidification_frequency_level=NumericControlOption(**CONTROL_HUMIDIFICATION_FREQUENCY_RANGE),
            timer_minutes=NumericControlOption(**CONTROL_TIMER_RANGE),
        )

    def build_control_session(self, db: Session, *, treatment_plan_id: str) -> TreatmentControlSessionResponse:
        plan = self.treatment_plan_repository.get_by_id(db=db, plan_id=treatment_plan_id)
        if plan is None:
            raise LookupError("Treatment plan not found.")

        payload = plan.raw_payload or {}
        return TreatmentControlSessionResponse(
            schema_version="mask_control.v1",
            execution_channel="reserved",
            treatment_plan_id=plan.plan_id,
            user_public_id=plan.user.public_id,
            overall_severity=payload.get("overall_severity", "medium"),
            summary_texts=LocalizedText.model_validate(payload.get("summary_texts")),
            global_settings=GlobalMaskSettings.model_validate(payload.get("global_settings")),
            zone_led_settings=[
                ZoneLedSetting.model_validate(zone)
                for zone in payload.get("zone_recommendations", [])
            ],
        )
