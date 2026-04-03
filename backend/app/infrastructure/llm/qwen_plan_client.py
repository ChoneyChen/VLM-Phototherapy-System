from openai import OpenAI

from app.core.config import Settings


class QwenTreatmentPlanClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_plan(self, prompt: str) -> str:
        if not self.settings.dashscope_api_key:
            raise ValueError("DASHSCOPE_API_KEY is not configured.")

        client = OpenAI(
            api_key=self.settings.dashscope_api_key,
            base_url=self.settings.qwen_base_url,
        )
        response = client.chat.completions.create(
            model=self.settings.qwen_plus_model_name,
            messages=[{"role": "user", "content": prompt}],
            extra_body={"enable_thinking": False},
            stream=False,
        )
        content = response.choices[0].message.content
        return content if isinstance(content, str) else str(content)
