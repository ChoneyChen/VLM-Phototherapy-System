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
    brightness_percent: int
    temperature_celsius: int
    humidification_frequency_level: int
    timer_minutes: int


class MaskZoneLedSetting(BaseModel):
    zone_name: str
    issue_category_code: str
    severity: str
    led_color_code: str


class TreatmentControlCommand(BaseModel):
    schema_version: str = "mask_control.v1"
    execution_channel: str = "reserved"
    treatment_plan_id: str
    user_public_id: str
    overall_severity: str
    global_settings: TreatmentControlValues
    zone_led_settings: list[MaskZoneLedSetting]
    safety_profile: TreatmentControlSafetyProfile


class TreatmentControlCommandBuilder:
    def build(
        self,
        *,
        treatment_plan_id: str,
        user_public_id: str,
        overall_severity: str,
        brightness_percent: int,
        temperature_celsius: int,
        humidification_frequency_level: int,
        timer_minutes: int,
        zone_led_settings: list[dict[str, str]],
    ) -> TreatmentControlCommand:
        return TreatmentControlCommand(
            treatment_plan_id=treatment_plan_id,
            user_public_id=user_public_id,
            overall_severity=overall_severity,
            global_settings=TreatmentControlValues(
                brightness_percent=brightness_percent,
                temperature_celsius=temperature_celsius,
                humidification_frequency_level=humidification_frequency_level,
                timer_minutes=timer_minutes,
            ),
            zone_led_settings=[MaskZoneLedSetting(**zone) for zone in zone_led_settings],
            safety_profile=TreatmentControlSafetyProfile(
                brightness_percent=ControlSafetyRange(**CONTROL_BRIGHTNESS_RANGE),
                temperature_celsius=ControlSafetyRange(**CONTROL_TEMPERATURE_RANGE),
                humidification_frequency_level=ControlSafetyRange(**CONTROL_HUMIDIFICATION_FREQUENCY_RANGE),
                timer_minutes=ControlSafetyRange(**CONTROL_TIMER_RANGE),
            ),
        )
