from pydantic import BaseModel

from app.domain.catalog import DURATION_RANGE, TEMPERATURE_RANGE


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
