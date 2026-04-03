from pydantic import BaseModel

from app.schemas.assessment import LocalizedText, Severity


class NumericControlOption(BaseModel):
    min: int
    max: int
    step: int
    unit: str


class ZoneLedSetting(BaseModel):
    zone_name: str
    issue_category_code: str
    severity: Severity
    led_color_code: str


class GlobalMaskSettings(BaseModel):
    brightness_percent: int
    temperature_celsius: int
    humidification_frequency_level: int
    timer_minutes: int


class TreatmentControlOptionsResponse(BaseModel):
    mask_zone_codes: list[str]
    light_color_codes: list[str]
    brightness_percent: NumericControlOption
    temperature_celsius: NumericControlOption
    humidification_frequency_level: NumericControlOption
    timer_minutes: NumericControlOption


class TreatmentControlPresetRequest(BaseModel):
    treatment_plan_id: str


class TreatmentControlSessionResponse(BaseModel):
    schema_version: str
    execution_channel: str
    treatment_plan_id: str
    user_public_id: str
    overall_severity: Severity
    summary_texts: LocalizedText
    global_settings: GlobalMaskSettings
    zone_led_settings: list[ZoneLedSetting]
