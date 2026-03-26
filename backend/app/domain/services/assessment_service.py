import json
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.domain.catalog import (
    ISSUE_CATEGORY_LABELS,
    LIGHT_TYPE_ALIASES,
    VALID_ISSUE_CATEGORIES,
    VALID_LIGHT_TYPES,
    VALID_SEVERITIES,
    ZONE_ALIASES,
    ZONE_ORDER,
)
from app.infrastructure.db.models import SkinAssessmentModel, ZoneObservationModel
from app.infrastructure.db.repositories import AssessmentRepository, UserRepository
from app.infrastructure.hardware.protocol import PhototherapyCommandBuilder
from app.infrastructure.llm.factory import VisionModelFactory
from app.infrastructure.llm.prompt_builder import AssessmentPromptBuilder
from app.infrastructure.storage.image_archive import ImageArchiveService
from app.schemas.assessment import (
    HardwareProfile,
    LocalizedStringList,
    LocalizedText,
    SkinAssessmentDetail,
    SkinAssessmentListItem,
    SkinAssessmentResponse,
    TreatmentPlan,
    ZoneAssessment,
)


class SkinAssessmentService:
    def __init__(
        self,
        user_repository: UserRepository,
        assessment_repository: AssessmentRepository,
        prompt_builder: AssessmentPromptBuilder,
        image_archive: ImageArchiveService,
        model_factory: VisionModelFactory,
    ) -> None:
        self.user_repository = user_repository
        self.assessment_repository = assessment_repository
        self.prompt_builder = prompt_builder
        self.image_archive = image_archive
        self.model_factory = model_factory
        self.command_builder = PhototherapyCommandBuilder()

    def assess_user_image(
        self,
        db: Session,
        user_public_id: str,
        provider: str,
        filename: str,
        mime_type: str,
        image_bytes: bytes,
        analysis_language: str = "en",
        clinician_notes: str | None = None,
    ) -> SkinAssessmentResponse:
        user = self.user_repository.get_by_public_id(db=db, user_public_id=user_public_id)
        if user is None:
            raise LookupError(f"User '{user_public_id}' does not exist.")

        if provider not in {"gemini", "qwen"}:
            raise ValueError("model_provider must be 'gemini' or 'qwen'.")
        if analysis_language not in {"en", "zh"}:
            raise ValueError("analysis_language must be 'en' or 'zh'.")

        assessment_id = f"ASM-{uuid.uuid4().hex[:12]}"
        stored_image_path = self.image_archive.save_assessment_image(
            user_public_id=user.public_id,
            assessment_id=assessment_id,
            filename=filename,
            mime_type=mime_type,
            image_bytes=image_bytes,
        )

        prompt = self.prompt_builder.build(
            user_name=user.name,
            analysis_language=analysis_language,
            clinician_notes=clinician_notes,
        )
        client = self.model_factory.get_client(provider)
        raw_text = client.generate_assessment(
            image_bytes=image_bytes,
            mime_type=mime_type,
            prompt=prompt,
        )
        normalized_payload = self._normalize_payload(
            payload=self._extract_json(raw_text),
            analysis_language=analysis_language,
        )

        assessment = self.assessment_repository.create_assessment(
            db=db,
            assessment_id=assessment_id,
            user=user,
            provider=provider,
            image_path=stored_image_path,
            payload=normalized_payload,
        )
        return self._to_response(assessment)

    def list_user_assessments(
        self,
        db: Session,
        user_public_id: str,
        limit: int = 30,
    ) -> list[SkinAssessmentListItem]:
        user = self.user_repository.get_by_public_id(db=db, user_public_id=user_public_id)
        if user is None:
            raise LookupError(f"User '{user_public_id}' does not exist.")

        records = self.assessment_repository.list_for_user(db=db, user_id=user.id, limit=limit)
        return [self._to_list_item(record) for record in records]

    def get_assessment_detail(self, db: Session, assessment_id: str) -> SkinAssessmentDetail | None:
        record = self.assessment_repository.get_by_id(db=db, assessment_id=assessment_id)
        if record is None:
            return None
        return self._to_detail(record)

    def delete_assessment(self, db: Session, assessment_id: str) -> bool:
        record = self.assessment_repository.get_by_id(db=db, assessment_id=assessment_id)
        if record is None:
            return False

        image_path = record.image_path
        deleted = self.assessment_repository.delete_by_id(db=db, assessment_id=assessment_id)
        if deleted is None:
            return False

        self.image_archive.delete_assessment_image(image_path)
        return True

    def _extract_json(self, raw_text: str) -> dict[str, Any]:
        if not raw_text.strip():
            raise ValueError("The model returned an empty response.")

        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Unable to find a JSON object in the model response.")

        return json.loads(cleaned[start : end + 1])

    def _normalize_payload(self, payload: dict[str, Any], analysis_language: str) -> dict[str, Any]:
        normalized_zones: dict[str, dict[str, Any]] = {}

        for raw_zone in payload.get("zones", []):
            canonical_zone = self._normalize_zone_name(str(raw_zone.get("zone_name", "")))
            if canonical_zone is None:
                continue

            treatment = raw_zone.get("treatment_plan", {}) or {}
            light_type_code = self._normalize_light_type(treatment.get("light_type_code") or treatment.get("light_type"))
            temperature_celsius = self._clamp_int(
                treatment.get("temperature_celsius"),
                default=34,
                minimum=30,
                maximum=42,
            )
            duration_minutes = self._clamp_int(
                treatment.get("duration_minutes"),
                default=8,
                minimum=4,
                maximum=20,
            )
            humidification_enabled = self._normalize_bool(
                treatment.get("humidification_enabled", treatment.get("humidification", False))
            )

            hardware_profile = treatment.get("hardware_profile", {}) or {}
            normalized_zones[canonical_zone] = {
                "zone_name": canonical_zone,
                "issue_category_code": self._normalize_issue_category(
                    raw_zone.get("issue_category_code") or raw_zone.get("issue_category")
                ),
                "severity": self._normalize_severity(raw_zone.get("severity")),
                "summary_texts": self._normalize_localized_text(
                    raw_zone.get("summary_texts") or raw_zone.get("summary"),
                    default_en="The model returned insufficient detail for this zone.",
                    default_zh="该分区返回的信息不足，建议补拍清晰正面照片后复核。",
                    analysis_language=analysis_language,
                ),
                "treatment_plan": {
                    "light_type_code": light_type_code,
                    "temperature_celsius": temperature_celsius,
                    "duration_minutes": duration_minutes,
                    "humidification_enabled": humidification_enabled,
                    "notes_texts": self._normalize_localized_text(
                        treatment.get("notes_texts") or treatment.get("notes"),
                        default_en="Use a conservative treatment plan and reassess after the session.",
                        default_zh="建议采用保守方案，并在治疗后复评。",
                        analysis_language=analysis_language,
                    ),
                    "hardware_profile": self._normalize_hardware_profile(
                        raw_profile=hardware_profile,
                        zone_code=canonical_zone,
                        light_type_code=light_type_code,
                        temperature_celsius=temperature_celsius,
                        duration_minutes=duration_minutes,
                        humidification_enabled=humidification_enabled,
                    ),
                },
            }

        for zone_name in ZONE_ORDER:
            normalized_zones.setdefault(
                zone_name,
                self._build_fallback_zone(zone_name=zone_name, analysis_language=analysis_language),
            )

        return {
            "analysis_language": analysis_language,
            "overall_condition_texts": self._normalize_localized_text(
                payload.get("overall_condition_texts") or payload.get("overall_condition"),
                default_en="Mixed skin condition",
                default_zh="混合型皮肤表现",
                analysis_language=analysis_language,
            ),
            "overall_severity": self._normalize_severity(payload.get("overall_severity")),
            "overall_summary_texts": self._normalize_localized_text(
                payload.get("overall_summary_texts") or payload.get("overall_summary"),
                default_en="Visible dryness, tone irregularity, or sensitivity indicators require follow-up observation.",
                default_zh="可见干燥、肤色不均或敏感迹象，建议持续观察并复评。",
                analysis_language=analysis_language,
            ),
            "recommended_focus_texts": self._normalize_localized_list(
                payload.get("recommended_focus_texts") or payload.get("recommended_focus"),
                default_en=["Hydration support", "Barrier comfort", "Texture observation"],
                default_zh=["补水支持", "屏障舒缓", "纹理观察"],
                analysis_language=analysis_language,
            ),
            "zones": [normalized_zones[zone_name] for zone_name in ZONE_ORDER],
        }

    def _normalize_zone_name(self, raw_name: str) -> str | None:
        return ZONE_ALIASES.get(raw_name.strip().lower())

    def _normalize_issue_category(self, value: Any) -> str:
        code = str(value or "insufficient_data").strip().lower()
        return code if code in VALID_ISSUE_CATEGORIES else "insufficient_data"

    def _normalize_light_type(self, value: Any) -> str:
        code = str(value or "amber").strip().lower()
        canonical = LIGHT_TYPE_ALIASES.get(code, code)
        return canonical if canonical in VALID_LIGHT_TYPES else "amber"

    def _normalize_severity(self, value: Any) -> str:
        severity = str(value or "medium").strip().lower()
        return severity if severity in VALID_SEVERITIES else "medium"

    def _normalize_bool(self, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return bool(value)

    def _clamp_int(self, value: Any, default: int, minimum: int, maximum: int) -> int:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = default
        return max(minimum, min(parsed, maximum))

    def _normalize_localized_text(
        self,
        value: Any,
        *,
        default_en: str,
        default_zh: str,
        analysis_language: str,
    ) -> dict[str, str]:
        if isinstance(value, dict):
            en_text = str(value.get("en") or "").strip() or default_en
            zh_text = str(value.get("zh") or "").strip() or default_zh
            return {"en": en_text, "zh": zh_text}

        if isinstance(value, str) and value.strip():
            text = value.strip()
            if analysis_language == "zh":
                return {"en": default_en, "zh": text}
            return {"en": text, "zh": default_zh}

        return {"en": default_en, "zh": default_zh}

    def _normalize_localized_list(
        self,
        value: Any,
        *,
        default_en: list[str],
        default_zh: list[str],
        analysis_language: str,
    ) -> dict[str, list[str]]:
        if isinstance(value, dict):
            en_items = [str(item).strip() for item in value.get("en", []) if str(item).strip()] or default_en
            zh_items = [str(item).strip() for item in value.get("zh", []) if str(item).strip()] or default_zh
            return {"en": en_items[:5], "zh": zh_items[:5]}

        if isinstance(value, list):
            cleaned = [str(item).strip() for item in value if str(item).strip()][:5]
            if analysis_language == "zh":
                return {"en": default_en, "zh": cleaned or default_zh}
            return {"en": cleaned or default_en, "zh": default_zh}

        return {"en": default_en, "zh": default_zh}

    def _normalize_hardware_profile(
        self,
        *,
        raw_profile: dict[str, Any],
        zone_code: str,
        light_type_code: str,
        temperature_celsius: int,
        duration_minutes: int,
        humidification_enabled: bool,
    ) -> dict[str, Any]:
        command = self.command_builder.build(
            zone_code=zone_code,
            light_type_code=light_type_code,
            temperature_celsius=self._clamp_int(
                raw_profile.get("temperature_celsius", temperature_celsius),
                default=temperature_celsius,
                minimum=30,
                maximum=42,
            ),
            duration_minutes=self._clamp_int(
                raw_profile.get("duration_minutes", duration_minutes),
                default=duration_minutes,
                minimum=4,
                maximum=20,
            ),
            humidification_enabled=self._normalize_bool(
                raw_profile.get("humidification_enabled", humidification_enabled)
            ),
        )
        return command.model_dump()

    def _build_fallback_zone(self, *, zone_name: str, analysis_language: str) -> dict[str, Any]:
        light_type_code = "amber"
        temperature_celsius = 33
        duration_minutes = 6
        humidification_enabled = True
        return {
            "zone_name": zone_name,
            "issue_category_code": "insufficient_data",
            "severity": "medium",
            "summary_texts": self._normalize_localized_text(
                None,
                default_en="This zone was not fully returned by the model. Retake a clear frontal image for confirmation.",
                default_zh="该分区未被完整返回，建议补拍清晰正面照片后再次识别。",
                analysis_language=analysis_language,
            ),
            "treatment_plan": {
                "light_type_code": light_type_code,
                "temperature_celsius": temperature_celsius,
                "duration_minutes": duration_minutes,
                "humidification_enabled": humidification_enabled,
                "notes_texts": self._normalize_localized_text(
                    None,
                    default_en="Fallback recommendation generated because the model response was incomplete.",
                    default_zh="由于模型返回不完整，系统生成了保守型兜底建议。",
                    analysis_language=analysis_language,
                ),
                "hardware_profile": self._normalize_hardware_profile(
                    raw_profile={},
                    zone_code=zone_name,
                    light_type_code=light_type_code,
                    temperature_celsius=temperature_celsius,
                    duration_minutes=duration_minutes,
                    humidification_enabled=humidification_enabled,
                ),
            },
        }

    def _to_list_item(self, model: SkinAssessmentModel) -> SkinAssessmentListItem:
        payload = model.raw_payload or {}
        return SkinAssessmentListItem(
            id=model.assessment_id,
            user_public_id=model.user.public_id,
            model_provider=model.model_provider,
            analysis_language=payload.get("analysis_language", "en"),
            overall_condition_texts=LocalizedText.model_validate(
                payload.get("overall_condition_texts")
                or {"en": model.overall_condition, "zh": model.overall_condition}
            ),
            overall_severity=model.overall_severity,
            overall_summary_texts=LocalizedText.model_validate(
                payload.get("overall_summary_texts")
                or {"en": model.overall_summary, "zh": model.overall_summary}
            ),
            image_path=model.image_path,
            captured_at=model.captured_at,
        )

    def _to_response(self, model: SkinAssessmentModel) -> SkinAssessmentResponse:
        payload = model.raw_payload or {}
        raw_zones = {zone.get("zone_name"): zone for zone in payload.get("zones", []) if isinstance(zone, dict)}
        return SkinAssessmentResponse(
            id=model.assessment_id,
            user_public_id=model.user.public_id,
            model_provider=model.model_provider,
            analysis_language=payload.get("analysis_language", "en"),
            overall_condition_texts=LocalizedText.model_validate(
                payload.get("overall_condition_texts")
                or {"en": model.overall_condition, "zh": model.overall_condition}
            ),
            overall_severity=model.overall_severity,
            overall_summary_texts=LocalizedText.model_validate(
                payload.get("overall_summary_texts")
                or {"en": model.overall_summary, "zh": model.overall_summary}
            ),
            recommended_focus_texts=LocalizedStringList.model_validate(
                payload.get("recommended_focus_texts")
                or {"en": payload.get("recommended_focus", []), "zh": payload.get("recommended_focus", [])}
            ),
            image_path=model.image_path,
            captured_at=model.captured_at,
            zones=[self._zone_to_schema(zone, raw_zone=raw_zones.get(zone.zone_name)) for zone in model.zones],
        )

    def _to_detail(self, model: SkinAssessmentModel) -> SkinAssessmentDetail:
        payload = model.raw_payload or {}
        raw_zones = {zone.get("zone_name"): zone for zone in payload.get("zones", []) if isinstance(zone, dict)}
        return SkinAssessmentDetail(
            id=model.assessment_id,
            user_public_id=model.user.public_id,
            model_provider=model.model_provider,
            analysis_language=payload.get("analysis_language", "en"),
            overall_condition_texts=LocalizedText.model_validate(
                payload.get("overall_condition_texts")
                or {"en": model.overall_condition, "zh": model.overall_condition}
            ),
            overall_severity=model.overall_severity,
            overall_summary_texts=LocalizedText.model_validate(
                payload.get("overall_summary_texts")
                or {"en": model.overall_summary, "zh": model.overall_summary}
            ),
            recommended_focus_texts=LocalizedStringList.model_validate(
                payload.get("recommended_focus_texts")
                or {"en": payload.get("recommended_focus", []), "zh": payload.get("recommended_focus", [])}
            ),
            image_path=model.image_path,
            captured_at=model.captured_at,
            zones=[self._zone_to_schema(zone, raw_zone=raw_zones.get(zone.zone_name)) for zone in model.zones],
        )

    def _zone_to_schema(self, zone: ZoneObservationModel, raw_zone: dict[str, Any] | None) -> ZoneAssessment:
        raw_zone = raw_zone or {}
        treatment_plan = raw_zone.get("treatment_plan", {}) or {}
        hardware_profile = treatment_plan.get("hardware_profile") or self.command_builder.build(
            zone_code=zone.zone_name,
            light_type_code=zone.treatment_light_type,
            temperature_celsius=zone.treatment_temperature_celsius,
            duration_minutes=zone.treatment_duration_minutes,
            humidification_enabled=zone.treatment_humidification,
        ).model_dump()

        return ZoneAssessment(
            zone_name=zone.zone_name,
            issue_category_code=zone.issue_category,
            severity=zone.severity,
            summary_texts=LocalizedText.model_validate(
                raw_zone.get("summary_texts") or {"en": zone.summary, "zh": zone.summary}
            ),
            treatment_plan=TreatmentPlan(
                light_type_code=zone.treatment_light_type,
                temperature_celsius=zone.treatment_temperature_celsius,
                duration_minutes=zone.treatment_duration_minutes,
                humidification_enabled=zone.treatment_humidification,
                notes_texts=LocalizedText.model_validate(
                    treatment_plan.get("notes_texts")
                    or {"en": zone.treatment_notes, "zh": zone.treatment_notes}
                ),
                hardware_profile=HardwareProfile.model_validate(hardware_profile),
            ),
        )
