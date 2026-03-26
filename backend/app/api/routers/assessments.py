from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_assessment_service, get_db
from app.domain.services.assessment_service import SkinAssessmentService
from app.schemas.assessment import SkinAssessmentDetail, SkinAssessmentResponse

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("", response_model=SkinAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    user_public_id: str = Form(...),
    model_provider: str = Form(...),
    analysis_language: str = Form(default="en"),
    clinician_notes: str | None = Form(default=None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    assessment_service: SkinAssessmentService = Depends(get_assessment_service),
) -> SkinAssessmentResponse:
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is empty.")

    try:
        return assessment_service.assess_user_image(
            db=db,
            user_public_id=user_public_id,
            provider=model_provider,
            filename=image.filename or "face-image.jpg",
            mime_type=image.content_type or "image/jpeg",
            image_bytes=image_bytes,
            analysis_language=analysis_language,
            clinician_notes=clinician_notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{assessment_id}", response_model=SkinAssessmentDetail)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    assessment_service: SkinAssessmentService = Depends(get_assessment_service),
) -> SkinAssessmentDetail:
    assessment = assessment_service.get_assessment_detail(db=db, assessment_id=assessment_id)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return assessment


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    assessment_service: SkinAssessmentService = Depends(get_assessment_service),
) -> None:
    deleted = assessment_service.delete_assessment(db=db, assessment_id=assessment_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
