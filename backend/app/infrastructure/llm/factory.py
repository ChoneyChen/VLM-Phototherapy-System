from app.core.config import Settings
from app.infrastructure.llm.base import VisionModelClient
from app.infrastructure.llm.gemini_client import GeminiVisionClient
from app.infrastructure.llm.qwen_client import QwenVisionClient


class VisionModelFactory:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def get_client(self, provider: str) -> VisionModelClient:
        if provider == "gemini":
            return GeminiVisionClient(settings=self.settings)
        if provider == "qwen":
            return QwenVisionClient(settings=self.settings)
        raise ValueError(f"Unsupported model provider: {provider}")
