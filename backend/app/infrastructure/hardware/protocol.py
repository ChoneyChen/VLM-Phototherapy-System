from pydantic import BaseModel

from app.domain.catalog import (
    CONTROL_BRIGHTNESS_RANGE,
    CONTROL_HUMIDIFICATION_FREQUENCY_RANGE,
    CONTROL_TEMPERATURE_RANGE,
    CONTROL_TIMER_RANGE,
    DURATION_RANGE,
    TEMPERATURE_RANGE,
)


class SafetyRange(BaseModel):
    min: int
    max: int
    unit: str


class HardwareSafetyProfile(BaseModel):
    temperature_celsius: SafetyRange
    duration_minutes: SafetyRange


class PhototherapyCommand(BaseModel):
    schema_version: str = "phototherapy_command.v1"
    execution_channel: str = "reserved"
    zone_code: str
    light_type_code: str
    temperature_celsius: int
    duration_minutes: int
    humidification_enabled: bool
    safety_profile: HardwareSafetyProfile


class PhototherapyCommandBuilder:
    def build(
        self,
        *,
        zone_code: str,
        light_type_code: str,
        temperature_celsius: int,
        duration_minutes: int,
        humidification_enabled: bool,
    ) -> PhototherapyCommand:
        return PhototherapyCommand(
            zone_code=zone_code,
            light_type_code=light_type_code,
            temperature_celsius=temperature_celsius,
            duration_minutes=duration_minutes,
            humidification_enabled=humidification_enabled,
            safety_profile=HardwareSafetyProfile(
                temperature_celsius=SafetyRange(**TEMPERATURE_RANGE),
                duration_minutes=SafetyRange(**DURATION_RANGE),
            ),
        )


class ControlSafetyRange(BaseModel):
    min: int
    max: int
    step: int
    unit: str


class TreatmentControlSafetyProfile(BaseModel):
    brightness_percent: ControlSafetyRange
    temperature_celsius: ControlSafetyRange
    humidification_frequency_level: ControlSafetyRange
    timer_minutes: ControlSafetyRange


class TreatmentControlValues(BaseModel):
    light_color_code: str
    brightness_percent: int
    temperature_celsius: int
    humidification_frequency_level: int
    timer_minutes: int


class TreatmentControlCommand(BaseModel):
    schema_version: str = "treatment_control.v1"
    execution_channel: str = "reserved"
    assessment_id: str
    zone_code: str
    recommended_issue_category_code: str
    recommended_light_type_code: str
    control_values: TreatmentControlValues
    safety_profile: TreatmentControlSafetyProfile


class TreatmentControlCommandBuilder:
    def build(
        self,
        *,
        assessment_id: str,
        zone_code: str,
        recommended_issue_category_code: str,
        recommended_light_type_code: str,
        light_color_code: str,
        brightness_percent: int,
        temperature_celsius: int,
        humidification_frequency_level: int,
        timer_minutes: int,
    ) -> TreatmentControlCommand:
        return TreatmentControlCommand(
            assessment_id=assessment_id,
            zone_code=zone_code,
            recommended_issue_category_code=recommended_issue_category_code,
            recommended_light_type_code=recommended_light_type_code,
            control_values=TreatmentControlValues(
                light_color_code=light_color_code,
                brightness_percent=brightness_percent,
                temperature_celsius=temperature_celsius,
                humidification_frequency_level=humidification_frequency_level,
                timer_minutes=timer_minutes,
            ),
            safety_profile=TreatmentControlSafetyProfile(
                brightness_percent=ControlSafetyRange(**CONTROL_BRIGHTNESS_RANGE),
                temperature_celsius=ControlSafetyRange(**CONTROL_TEMPERATURE_RANGE),
                humidification_frequency_level=ControlSafetyRange(**CONTROL_HUMIDIFICATION_FREQUENCY_RANGE),
                timer_minutes=ControlSafetyRange(**CONTROL_TIMER_RANGE),
            ),
        )
