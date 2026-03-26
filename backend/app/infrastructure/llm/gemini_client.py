import os

from google import genai
from google.genai import types

from app.core.config import Settings


class GeminiVisionClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_assessment(self, image_bytes: bytes, mime_type: str, prompt: str) -> str:
        if not self.settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        if self.settings.gemini_proxy_url:
            os.environ.setdefault("HTTPS_PROXY", self.settings.gemini_proxy_url)
            os.environ.setdefault("HTTP_PROXY", self.settings.gemini_proxy_url)

        client = genai.Client(api_key=self.settings.gemini_api_key)
        response = client.models.generate_content(
            model=self.settings.gemini_model_name,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt,
            ],
        )
        return response.text or ""
