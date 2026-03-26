from datetime import datetime
from typing import Literal

from pydantic import BaseModel

Severity = Literal["low", "medium", "high"]
Provider = Literal["gemini", "qwen"]
Language = Literal["en", "zh"]


class LocalizedText(BaseModel):
    en: str
    zh: str


class LocalizedStringList(BaseModel):
    en: list[str]
    zh: list[str]


class SafetyRange(BaseModel):
    min: int
    max: int
    unit: str


class HardwareSafetyProfile(BaseModel):
    temperature_celsius: SafetyRange
    duration_minutes: SafetyRange


class HardwareProfile(BaseModel):
    schema_version: str
    execution_channel: str
    zone_code: str
    light_type_code: str
    temperature_celsius: int
    duration_minutes: int
    humidification_enabled: bool
    safety_profile: HardwareSafetyProfile


class TreatmentPlan(BaseModel):
    light_type_code: str
    temperature_celsius: int
    duration_minutes: int
    humidification_enabled: bool
    notes_texts: LocalizedText
    hardware_profile: HardwareProfile


class ZoneAssessment(BaseModel):
    zone_name: str
    issue_category_code: str
    severity: Severity
    summary_texts: LocalizedText
    treatment_plan: TreatmentPlan


class SkinAssessmentListItem(BaseModel):
    id: str
    user_public_id: str
    model_provider: Provider
    analysis_language: Language
    overall_condition_texts: LocalizedText
    overall_severity: Severity
    overall_summary_texts: LocalizedText
    image_path: str
    captured_at: datetime


class SkinAssessmentResponse(BaseModel):
    id: str
    user_public_id: str
    model_provider: Provider
    analysis_language: Language
    overall_condition_texts: LocalizedText
    overall_severity: Severity
    overall_summary_texts: LocalizedText
    recommended_focus_texts: LocalizedStringList
    image_path: str
    captured_at: datetime
    zones: list[ZoneAssessment]


class SkinAssessmentDetail(SkinAssessmentResponse):
    pass
