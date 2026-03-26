from datetime import UTC, datetime
from pathlib import Path

from app.core.config import Settings

MIME_EXTENSION_MAP = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class ImageArchiveService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def save_assessment_image(
        self,
        user_public_id: str,
        assessment_id: str,
        filename: str,
        mime_type: str,
        image_bytes: bytes,
    ) -> str:
        captured_date = datetime.now(UTC).strftime("%Y-%m-%d")
        extension = self._resolve_extension(filename=filename, mime_type=mime_type)
        target_dir = self.settings.archive_dir / user_public_id / captured_date
        target_dir.mkdir(parents=True, exist_ok=True)

        target_path = target_dir / f"{assessment_id}{extension}"
        target_path.write_bytes(image_bytes)
        return self._to_relative_path(target_path)

    def delete_assessment_image(self, relative_path: str) -> None:
        target_path = self.settings.backend_dir / "data" / relative_path
        if target_path.exists():
            target_path.unlink()

    def _resolve_extension(self, filename: str, mime_type: str) -> str:
        suffix = Path(filename).suffix.lower()
        if suffix:
            return suffix
        return MIME_EXTENSION_MAP.get(mime_type.lower(), ".jpg")

    def _to_relative_path(self, absolute_path: Path) -> str:
        return absolute_path.relative_to(self.settings.backend_dir / "data").as_posix()
