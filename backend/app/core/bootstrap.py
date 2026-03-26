from app.core.config import get_settings
from app.infrastructure.db.session import init_db


def initialize_application() -> None:
    settings = get_settings()
    settings.runtime_dir.mkdir(parents=True, exist_ok=True)
    settings.archive_dir.mkdir(parents=True, exist_ok=True)
    init_db()
