from collections.abc import Generator

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.domain.services.assessment_service import SkinAssessmentService
from app.domain.services.user_service import UserService
from app.infrastructure.db.repositories import AssessmentRepository, UserRepository
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.llm.factory import VisionModelFactory
from app.infrastructure.llm.prompt_builder import AssessmentPromptBuilder
from app.infrastructure.storage.image_archive import ImageArchiveService


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_service() -> UserService:
    return UserService(user_repository=UserRepository())


def get_assessment_service() -> SkinAssessmentService:
    settings = get_settings()
    return SkinAssessmentService(
        user_repository=UserRepository(),
        assessment_repository=AssessmentRepository(),
        prompt_builder=AssessmentPromptBuilder(settings=settings),
        image_archive=ImageArchiveService(settings=settings),
        model_factory=VisionModelFactory(settings=settings),
    )
