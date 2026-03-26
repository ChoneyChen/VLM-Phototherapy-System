from typing import Any

from sqlalchemy.orm import Session

from app.domain.catalog import (
    CONTROL_BRIGHTNESS_RANGE,
    CONTROL_HUMIDIFICATION_FREQUENCY_RANGE,
    CONTROL_TEMPERATURE_RANGE,
    CONTROL_TIMER_RANGE,
    LIGHT_COLOR_CODES,
    LIGHT_TYPE_TO_COLOR_MAP,
    ZONE_ALIASES,
)
from app.infrastructure.db.repositories import AssessmentRepository
from app.infrastructure.hardware.protocol import TreatmentControlCommandBuilder
from app.schemas.assessment import LocalizedText
from app.schemas.control import (
    NumericControlOption,
    TreatmentControlOptionsResponse,
    TreatmentControlSessionResponse,
    TreatmentControlValues,
)


class TreatmentControlService:
    def __init__(self, assessment_repository: AssessmentRepository) -> None:
        self.assessment_repository = assessment_repository
        self.command_builder = TreatmentControlCommandBuilder()

    def get_control_options(self) -> TreatmentControlOptionsResponse:
        return TreatmentControlOptionsResponse(
            light_color_codes=LIGHT_COLOR_CODES,
            brightness_percent=NumericControlOption(**CONTROL_BRIGHTNESS_RANGE),
            temperature_celsius=NumericControlOption(**CONTROL_TEMPERATURE_RANGE),
            humidification_frequency_level=NumericControlOption(**CONTROL_HUMIDIFICATION_FREQUENCY_RANGE),
            timer_minutes=NumericControlOption(**CONTROL_TIMER_RANGE),
        )

    def build_control_session(
        self,
        db: Session,
        *,
        assessment_id: str,
        zone_name: str,
    ) -> TreatmentControlSessionResponse:
        assessment = self.assessment_repository.get_by_id(db=db, assessment_id=assessment_id)
        if assessment is None:
            raise LookupError("Assessment not found.")

        zone_code = self._normalize_zone_name(zone_name)
        payload = assessment.raw_payload or {}
        zone_payload = self._find_zone_payload(payload, zone_code)
        zone_model = next((zone for zone in assessment.zones if zone.zone_name == zone_code), None)
        if zone_payload is None and zone_model is None:
            raise LookupError(f"Zone '{zone_name}' was not found in this assessment.")

        treatment_plan = zone_payload.get("treatment_plan", {}) if zone_payload else {}
        recommended_light_type_value = treatment_plan.get("light_type_code") if treatment_plan else None
        if recommended_light_type_value is None and zone_model is not None:
            recommended_light_type_value = zone_model.treatment_light_type
        recommended_light_type_code = str(recommended_light_type_value or "amber").strip() or "amber"
        recommended_duration_minutes = self._clamp_int(
            treatment_plan.get("duration_minutes") if treatment_plan else None,
            default=zone_model.treatment_duration_minutes if zone_model else 10,
            range_config=CONTROL_TIMER_RANGE,
        )
        recommended_humidification_enabled = self._normalize_bool(
            treatment_plan.get("humidification_enabled") if treatment_plan else None
            if zone_payload
            else zone_model.treatment_humidification if zone_model else False
        )
        recommended_temperature = self._clamp_int(
            treatment_plan.get("temperature_celsius") if treatment_plan else None,
            default=zone_model.treatment_temperature_celsius if zone_model else 33,
            range_config=CONTROL_TEMPERATURE_RANGE,
        )
        issue_category_value = zone_payload.get("issue_category_code") if zone_payload else None
        if issue_category_value is None and zone_model is not None:
            issue_category_value = zone_model.issue_category
        issue_category_code = str(issue_category_value or "insufficient_data").strip() or "insufficient_data"

        severity_value = zone_payload.get("severity") if zone_payload else None
        if severity_value is None and zone_model is not None:
            severity_value = zone_model.severity
        recommended_severity = str(severity_value or "medium").strip() or "medium"

        command = self.command_builder.build(
            assessment_id=assessment.assessment_id,
            zone_code=zone_code,
            recommended_issue_category_code=issue_category_code,
            recommended_light_type_code=recommended_light_type_code,
            light_color_code=LIGHT_TYPE_TO_COLOR_MAP.get(recommended_light_type_code, "yellow"),
            brightness_percent=60,
            temperature_celsius=recommended_temperature,
            humidification_frequency_level=55 if recommended_humidification_enabled else 0,
            timer_minutes=recommended_duration_minutes,
        )

        return TreatmentControlSessionResponse(
            schema_version=command.schema_version,
            execution_channel=command.execution_channel,
            assessment_id=assessment.assessment_id,
            zone_code=zone_code,
            recommended_issue_category_code=issue_category_code,
            recommended_severity=recommended_severity,
            recommended_summary_texts=self._build_localized_text(
                zone_payload.get("summary_texts") if zone_payload else None,
                fallback=zone_model.summary if zone_model else "Structured summary unavailable.",
            ),
            recommended_light_type_code=recommended_light_type_code,
            recommended_duration_minutes=recommended_duration_minutes,
            recommended_humidification_enabled=recommended_humidification_enabled,
            recommended_notes_texts=self._build_localized_text(
                treatment_plan.get("notes_texts") if treatment_plan else None,
                fallback=zone_model.treatment_notes if zone_model else "Conservative hardware preset generated.",
            ),
            control_values=TreatmentControlValues.model_validate(command.control_values.model_dump()),
        )

    def _normalize_zone_name(self, zone_name: str) -> str:
        normalized = ZONE_ALIASES.get(zone_name.strip().lower())
        return normalized or zone_name

    def _find_zone_payload(self, payload: dict[str, Any], zone_code: str) -> dict[str, Any] | None:
        for item in payload.get("zones", []):
            if not isinstance(item, dict):
                continue
            candidate = str(item.get("zone_name", "")).strip()
            if candidate == zone_code or self._normalize_zone_name(candidate) == zone_code:
                return item
        return None

    def _build_localized_text(self, value: Any, *, fallback: str) -> LocalizedText:
        if isinstance(value, dict):
            return LocalizedText(
                en=str(value.get("en") or "").strip() or fallback,
                zh=str(value.get("zh") or "").strip() or fallback,
            )
        if isinstance(value, str) and value.strip():
            return LocalizedText(en=value.strip(), zh=value.strip())
        return LocalizedText(en=fallback, zh=fallback)

    def _normalize_bool(self, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return bool(value)

    def _clamp_int(self, value: Any, *, default: int, range_config: dict[str, int | str]) -> int:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = default
        return max(int(range_config["min"]), min(parsed, int(range_config["max"])))
