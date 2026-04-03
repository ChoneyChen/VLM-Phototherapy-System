from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.assessment import LocalizedText, Severity
from app.schemas.control import GlobalMaskSettings, ZoneLedSetting

TreatmentRecordStatus = Literal["running", "paused", "completed"]


class TreatmentRecordCreate(BaseModel):
    treatment_plan_id: str
    global_settings: GlobalMaskSettings
    zone_led_settings: list[ZoneLedSetting]


class TreatmentRecordStatusUpdate(BaseModel):
    status: TreatmentRecordStatus


class TreatmentRecordRead(BaseModel):
    id: str
    user_public_id: str
    treatment_plan_id: str
    plan_summary_texts: LocalizedText
    overall_severity: Severity
    status: TreatmentRecordStatus
    timer_minutes: int
    created_at: datetime
    updated_at: datetime
    global_settings: GlobalMaskSettings
    zone_led_settings: list[ZoneLedSetting]
