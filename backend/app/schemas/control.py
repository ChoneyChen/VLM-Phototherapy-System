from pydantic import BaseModel

from app.schemas.assessment import LocalizedText, Severity


class NumericControlOption(BaseModel):
    min: int
    max: int
    step: int
    unit: str


class TreatmentControlOptionsResponse(BaseModel):
    light_color_codes: list[str]
    brightness_percent: NumericControlOption
    temperature_celsius: NumericControlOption
    humidification_frequency_level: NumericControlOption
    timer_minutes: NumericControlOption


class TreatmentControlPresetRequest(BaseModel):
    assessment_id: str
    zone_name: str


class TreatmentControlValues(BaseModel):
    light_color_code: str
    brightness_percent: int
    temperature_celsius: int
    humidification_frequency_level: int
    timer_minutes: int


class TreatmentControlSessionResponse(BaseModel):
    schema_version: str
    execution_channel: str
    assessment_id: str
    zone_code: str
    recommended_issue_category_code: str
    recommended_severity: Severity
    recommended_summary_texts: LocalizedText
    recommended_light_type_code: str
    recommended_duration_minutes: int
    recommended_humidification_enabled: bool
    recommended_notes_texts: LocalizedText
    control_values: TreatmentControlValues
