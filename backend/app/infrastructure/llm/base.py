from typing import Protocol


class VisionModelClient(Protocol):
    def generate_assessment(self, image_bytes: bytes, mime_type: str, prompt: str) -> str: ...
