from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.assessment import LocalizedText, Severity
from app.schemas.control import GlobalMaskSettings

PlannerProvider = Literal["qwen_plus"]


class TreatmentPlanZone(BaseModel):
    zone_name: str
    issue_category_code: str
    severity: Severity
    led_color_code: str
    notes_texts: LocalizedText


class TreatmentPlanGenerateRequest(BaseModel):
    assessment_id: str


class TreatmentPlanListItem(BaseModel):
    id: str
    user_public_id: str
    assessment_id: str
    planner_model_provider: PlannerProvider
    overall_severity: Severity
    summary_texts: LocalizedText
    zones: list[TreatmentPlanZone]
    created_at: datetime


class TreatmentPlanDetail(TreatmentPlanListItem):
    rationale_texts: LocalizedText
    global_settings: GlobalMaskSettings
