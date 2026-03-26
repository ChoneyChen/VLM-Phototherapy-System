from app.core.config import get_settings
from app.infrastructure.llm.prompt_builder import AssessmentPromptBuilder


def test_prompt_builder_contains_required_zone() -> None:
    builder = AssessmentPromptBuilder(settings=get_settings())
    prompt = builder.build(user_name="Demo User", analysis_language="en")
    assert "Forehead Zone" in prompt
    assert "Treatment case samples" in prompt
