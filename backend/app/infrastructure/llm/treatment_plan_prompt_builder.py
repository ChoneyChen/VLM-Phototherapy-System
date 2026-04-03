import json

from app.core.config import Settings


class TreatmentPlanPromptBuilder:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def build(
        self,
        *,
        user_name: str,
        assessment_payload: dict,
    ) -> str:
        prompt_template = self.settings.treatment_plan_prompt_template_path.read_text(encoding="utf-8")
        contract = json.loads(self.settings.treatment_plan_contract_path.read_text(encoding="utf-8"))
        case_memory = json.loads(self.settings.treatment_plan_case_memory_path.read_text(encoding="utf-8"))
        device_profile = json.loads(self.settings.treatment_plan_device_profile_path.read_text(encoding="utf-8"))
        guidelines = self.settings.treatment_plan_guideline_path.read_text(encoding="utf-8")
        notes = self.settings.treatment_plan_note_template_path.read_text(encoding="utf-8")

        prompt_sections = [
            prompt_template,
            f"Patient display name: {user_name}",
            "Assessment payload:",
            json.dumps(assessment_payload, ensure_ascii=False, indent=2),
            "Treatment plan output contract:",
            json.dumps(contract["output_contract"], ensure_ascii=False, indent=2),
            "Editable clinical case memory:",
            json.dumps(case_memory, ensure_ascii=False, indent=2),
            "Mask device profile:",
            json.dumps(device_profile, ensure_ascii=False, indent=2),
            "Clinical guidelines:",
            guidelines,
            "Authoring notes:",
            notes,
        ]
        return "\n\n".join(prompt_sections)
