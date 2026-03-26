import base64

from openai import OpenAI

from app.core.config import Settings


class QwenVisionClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_assessment(self, image_bytes: bytes, mime_type: str, prompt: str) -> str:
        if not self.settings.dashscope_api_key:
            raise ValueError("DASHSCOPE_API_KEY is not configured.")

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{encoded_image}"

        client = OpenAI(
            api_key=self.settings.dashscope_api_key,
            base_url=self.settings.qwen_base_url,
        )
        response = client.chat.completions.create(
            model=self.settings.qwen_model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }
            ],
            extra_body={"enable_thinking": False},
            stream=False,
        )
        content = response.choices[0].message.content
        return content if isinstance(content, str) else str(content)
