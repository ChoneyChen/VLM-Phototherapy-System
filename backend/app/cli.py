import json
import mimetypes
from pathlib import Path

import typer

from app.core.bootstrap import initialize_application
from app.domain.services.assessment_service import SkinAssessmentService
from app.domain.services.user_service import UserService
from app.infrastructure.db.repositories import AssessmentRepository, UserRepository
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.llm.factory import VisionModelFactory
from app.infrastructure.llm.prompt_builder import AssessmentPromptBuilder
from app.infrastructure.storage.image_archive import ImageArchiveService

cli = typer.Typer(help="CLI for the VLM phototherapy backend.")
users_cli = typer.Typer(help="User management commands.")
cli.add_typer(users_cli, name="users")


def _build_user_service() -> UserService:
    return UserService(user_repository=UserRepository())


def _build_assessment_service() -> SkinAssessmentService:
    from app.core.config import get_settings

    settings = get_settings()
    return SkinAssessmentService(
        user_repository=UserRepository(),
        assessment_repository=AssessmentRepository(),
        prompt_builder=AssessmentPromptBuilder(settings=settings),
        image_archive=ImageArchiveService(settings=settings),
        model_factory=VisionModelFactory(settings=settings),
    )


@users_cli.command("list")
def list_users() -> None:
    initialize_application()
    service = _build_user_service()
    with SessionLocal() as db:
        users = service.list_users(db=db)
        typer.echo(json.dumps([user.model_dump(mode="json") for user in users], ensure_ascii=False, indent=2))


@users_cli.command("create")
def create_user(name: str = typer.Option(..., "--name"), notes: str = typer.Option("", "--notes")) -> None:
    initialize_application()
    service = _build_user_service()
    from app.schemas.user import UserCreate

    with SessionLocal() as db:
        user = service.create_user(db=db, payload=UserCreate(name=name, notes=notes or None))
        typer.echo(json.dumps(user.model_dump(mode="json"), ensure_ascii=False, indent=2))


@cli.command("assess")
def assess_image(
    user: str = typer.Option(..., "--user"),
    image: Path = typer.Option(..., "--image"),
    provider: str = typer.Option(..., "--provider"),
    language: str = typer.Option("en", "--language"),
    clinician_notes: str = typer.Option("", "--notes"),
) -> None:
    initialize_application()
    if not image.exists():
        raise typer.BadParameter(f"Image does not exist: {image}")

    mime_type, _ = mimetypes.guess_type(str(image))
    service = _build_assessment_service()
    with SessionLocal() as db:
        assessment = service.assess_user_image(
            db=db,
            user_public_id=user,
            provider=provider,
            filename=image.name,
            mime_type=mime_type or "image/jpeg",
            image_bytes=image.read_bytes(),
            analysis_language=language,
            clinician_notes=clinician_notes or None,
        )
        typer.echo(json.dumps(assessment.model_dump(mode="json"), ensure_ascii=False, indent=2))


def main() -> None:
    cli()


if __name__ == "__main__":
    main()
