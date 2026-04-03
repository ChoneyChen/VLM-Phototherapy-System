import json
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.domain.catalog import (
    CONTROL_BRIGHTNESS_RANGE,
    CONTROL_HUMIDIFICATION_FREQUENCY_RANGE,
    CONTROL_TEMPERATURE_RANGE,
    CONTROL_TIMER_RANGE,
    ISSUE_TO_LED_COLOR_MAP,
    LIGHT_COLOR_CODES,
    VALID_ISSUE_CATEGORIES,
    VALID_SEVERITIES,
    ZONE_ORDER,
)
from app.infrastructure.db.models import SkinAssessmentModel, TreatmentPlanModel
from app.infrastructure.db.repositories import AssessmentRepository, TreatmentPlanRepository, UserRepository
from app.infrastructure.llm.qwen_plan_client import QwenTreatmentPlanClient
from app.infrastructure.llm.treatment_plan_prompt_builder import TreatmentPlanPromptBuilder
from app.schemas.assessment import LocalizedText
from app.schemas.control import GlobalMaskSettings
from app.schemas.treatment_plan import TreatmentPlanDetail, TreatmentPlanListItem, TreatmentPlanZone


class TreatmentPlanService:
    def __init__(
        self,
        user_repository: UserRepository,
        assessment_repository: AssessmentRepository,
        treatment_plan_repository: TreatmentPlanRepository,
        prompt_builder: TreatmentPlanPromptBuilder,
        planner_client: QwenTreatmentPlanClient,
    ) -> None:
        self.user_repository = user_repository
        self.assessment_repository = assessment_repository
        self.treatment_plan_repository = treatment_plan_repository
        self.prompt_builder = prompt_builder
        self.planner_client = planner_client

    def generate_plan_from_assessment(self, db: Session, *, assessment_id: str) -> TreatmentPlanDetail:
        assessment = self.assessment_repository.get_by_id(db=db, assessment_id=assessment_id)
        if assessment is None:
            raise LookupError("Assessment not found.")

        prompt = self.prompt_builder.build(
            user_name=assessment.user.name,
            assessment_payload=assessment.raw_payload,
        )
        raw_text = self.planner_client.generate_plan(prompt)
        normalized_payload = self._normalize_payload(
            generated_payload=self._extract_json(raw_text),
            assessment=assessment,
        )

        plan = self.treatment_plan_repository.create_plan(
            db=db,
            plan_id=f"TPL-{uuid.uuid4().hex[:12]}",
            user=assessment.user,
            assessment=assessment,
            model_provider="qwen_plus",
            payload=normalized_payload,
        )
        return self._to_detail(plan)

    def list_user_plans(self, db: Session, *, user_public_id: str, limit: int = 30) -> list[TreatmentPlanListItem]:
        user = self.user_repository.get_by_public_id(db=db, user_public_id=user_public_id)
        if user is None:
            raise LookupError(f"User '{user_public_id}' does not exist.")

        plans = self.treatment_plan_repository.list_for_user(db=db, user_id=user.id, limit=limit)
        return [self._to_list_item(plan) for plan in plans]

    def get_plan_detail(self, db: Session, *, plan_id: str) -> TreatmentPlanDetail | None:
        plan = self.treatment_plan_repository.get_by_id(db=db, plan_id=plan_id)
        if plan is None:
            return None
        return self._to_detail(plan)

    def _extract_json(self, raw_text: str) -> dict[str, Any]:
        if not raw_text.strip():
            raise ValueError("The model returned an empty response.")

        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Unable to find a JSON object in the treatment plan response.")

        return json.loads(cleaned[start : end + 1])

    def _normalize_payload(self, *, generated_payload: dict[str, Any], assessment: SkinAssessmentModel) -> dict[str, Any]:
        assessment_payload = assessment.raw_payload or {}
        assessment_zones = {
            zone["zone_name"]: zone
            for zone in assessment_payload.get("zones", [])
            if isinstance(zone, dict) and isinstance(zone.get("zone_name"), str)
        }
        generated_zones = {
            zone["zone_name"]: zone
            for zone in generated_payload.get("zone_recommendations", [])
            if isinstance(zone, dict) and isinstance(zone.get("zone_name"), str)
        }

        normalized_zones: list[dict[str, Any]] = []
        for zone_name in ZONE_ORDER:
            assessment_zone = assessment_zones.get(zone_name, {})
            generated_zone = generated_zones.get(zone_name, {})

            issue_category_code = self._normalize_issue_category(
                generated_zone.get("issue_category_code") or assessment_zone.get("issue_category_code")
            )
            severity = self._normalize_severity(
                generated_zone.get("severity") or assessment_zone.get("severity") or assessment.overall_severity
            )
            led_color_code = self._normalize_led_color(
                generated_zone.get("led_color_code"),
                issue_category_code=issue_category_code,
            )

            normalized_zones.append(
                {
                    "zone_name": zone_name,
                    "issue_category_code": issue_category_code,
                    "severity": severity,
                    "led_color_code": led_color_code,
                    "notes_texts": self._normalize_localized_text(
                        generated_zone.get("notes_texts") or generated_zone.get("notes"),
                        default_en=f"Editable LED color preset for {zone_name}.",
                        default_zh=f"{zone_name} 的可编辑 LED 颜色预设。",
                    ),
                }
            )

        overall_severity = self._normalize_severity(
            generated_payload.get("overall_severity") or assessment_payload.get("overall_severity") or assessment.overall_severity
        )
        global_settings = self._normalize_global_settings(
            generated_payload.get("global_settings"),
            assessment_payload=assessment_payload,
            overall_severity=overall_severity,
        )

        return {
            "overall_severity": overall_severity,
            "summary_texts": self._normalize_localized_text(
                generated_payload.get("summary_texts") or generated_payload.get("summary"),
                default_en="Structured mask treatment plan generated from the archived assessment.",
                default_zh="已根据历史面部档案生成结构化面罩治疗方案。",
            ),
            "rationale_texts": self._normalize_localized_text(
                generated_payload.get("rationale_texts") or generated_payload.get("rationale"),
                default_en="This plan keeps facial LED control per zone while reserving global thermal and humidification controls.",
                default_zh="该方案保留分区 LED 控制，并将加热和加湿作为全局控制参数。",
            ),
            "global_settings": global_settings,
            "zone_recommendations": normalized_zones,
        }

    def _normalize_global_settings(
        self,
        value: Any,
        *,
        assessment_payload: dict[str, Any],
        overall_severity: str,
    ) -> dict[str, int]:
        value = value if isinstance(value, dict) else {}
        zone_issues = {
            str(zone.get("issue_category_code", "")).strip()
            for zone in assessment_payload.get("zones", [])
            if isinstance(zone, dict)
        }

        default_temperature = 31 if overall_severity == "high" else 33
        default_brightness = 52 if overall_severity == "high" else 60
        default_humidification = 65 if {"dehydration", "barrier_sensitivity", "erythema"} & zone_issues else 30
        default_timer = 14 if overall_severity == "high" else 11 if overall_severity == "medium" else 8

        return {
            "brightness_percent": self._clamp_int(
                value.get("brightness_percent"),
                default=default_brightness,
                minimum=int(CONTROL_BRIGHTNESS_RANGE["min"]),
                maximum=int(CONTROL_BRIGHTNESS_RANGE["max"]),
            ),
            "temperature_celsius": self._clamp_int(
                value.get("temperature_celsius"),
                default=default_temperature,
                minimum=int(CONTROL_TEMPERATURE_RANGE["min"]),
                maximum=int(CONTROL_TEMPERATURE_RANGE["max"]),
            ),
            "humidification_frequency_level": self._clamp_int(
                value.get("humidification_frequency_level"),
                default=default_humidification,
                minimum=int(CONTROL_HUMIDIFICATION_FREQUENCY_RANGE["min"]),
                maximum=int(CONTROL_HUMIDIFICATION_FREQUENCY_RANGE["max"]),
            ),
            "timer_minutes": self._clamp_int(
                value.get("timer_minutes"),
                default=default_timer,
                minimum=int(CONTROL_TIMER_RANGE["min"]),
                maximum=int(CONTROL_TIMER_RANGE["max"]),
            ),
        }

    def _normalize_issue_category(self, value: Any) -> str:
        code = str(value or "insufficient_data").strip().lower()
        return code if code in VALID_ISSUE_CATEGORIES else "insufficient_data"

    def _normalize_severity(self, value: Any) -> str:
        severity = str(value or "medium").strip().lower()
        return severity if severity in VALID_SEVERITIES else "medium"

    def _normalize_led_color(self, value: Any, *, issue_category_code: str) -> str:
        code = str(value or "").strip().lower()
        if code in LIGHT_COLOR_CODES:
            return code
        return ISSUE_TO_LED_COLOR_MAP.get(issue_category_code, "yellow")

    def _normalize_localized_text(self, value: Any, *, default_en: str, default_zh: str) -> dict[str, str]:
        if isinstance(value, dict):
            en_text = str(value.get("en") or "").strip() or default_en
            zh_text = str(value.get("zh") or "").strip() or default_zh
            return {"en": en_text, "zh": zh_text}

        if isinstance(value, str) and value.strip():
            return {"en": value.strip(), "zh": default_zh}

        return {"en": default_en, "zh": default_zh}

    def _clamp_int(self, value: Any, *, default: int, minimum: int, maximum: int) -> int:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = default
        return max(minimum, min(parsed, maximum))

    def _to_list_item(self, model: TreatmentPlanModel) -> TreatmentPlanListItem:
        payload = model.raw_payload or {}
        return TreatmentPlanListItem(
            id=model.plan_id,
            user_public_id=model.user.public_id,
            assessment_id=model.assessment_id,
            planner_model_provider="qwen_plus",
            overall_severity=payload.get("overall_severity", model.overall_severity),
            summary_texts=LocalizedText.model_validate(payload.get("summary_texts")),
            zones=[
                TreatmentPlanZone.model_validate(zone)
                for zone in payload.get("zone_recommendations", [])
            ],
            created_at=model.created_at,
        )

    def _to_detail(self, model: TreatmentPlanModel) -> TreatmentPlanDetail:
        payload = model.raw_payload or {}
        return TreatmentPlanDetail(
            id=model.plan_id,
            user_public_id=model.user.public_id,
            assessment_id=model.assessment_id,
            planner_model_provider="qwen_plus",
            overall_severity=payload.get("overall_severity", model.overall_severity),
            summary_texts=LocalizedText.model_validate(payload.get("summary_texts")),
            rationale_texts=LocalizedText.model_validate(payload.get("rationale_texts")),
            global_settings=GlobalMaskSettings.model_validate(payload.get("global_settings")),
            zones=[
                TreatmentPlanZone.model_validate(zone)
                for zone in payload.get("zone_recommendations", [])
            ],
            created_at=model.created_at,
        )
