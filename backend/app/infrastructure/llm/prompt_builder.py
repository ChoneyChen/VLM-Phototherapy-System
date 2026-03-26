import json

from app.core.config import Settings


class AssessmentPromptBuilder:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def build(
        self,
        user_name: str,
        analysis_language: str,
        clinician_notes: str | None = None,
    ) -> str:
        prompt_template = self.settings.prompt_template_path.read_text(encoding="utf-8")
        taxonomy = json.loads(self.settings.knowledge_taxonomy_path.read_text(encoding="utf-8"))
        treatment_cases = json.loads(self.settings.treatment_case_library_path.read_text(encoding="utf-8"))
        contract = json.loads(self.settings.assessment_contract_path.read_text(encoding="utf-8"))

        prompt_sections = [
            prompt_template,
            f"Patient display name: {user_name}",
            f"Primary interface language: {analysis_language}",
            f"Clinician notes: {clinician_notes or 'None provided.'}",
            "Assessment taxonomy:",
            json.dumps(taxonomy, ensure_ascii=False, indent=2),
            "Treatment case samples:",
            json.dumps(treatment_cases, ensure_ascii=False, indent=2),
            "Output contract:",
            json.dumps(contract["output_contract"], ensure_ascii=False, indent=2),
        ]
        return "\n\n".join(prompt_sections)
