from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_assessment_service, get_db, get_user_service
from app.domain.services.assessment_service import SkinAssessmentService
from app.domain.services.user_service import UserService
from app.schemas.assessment import SkinAssessmentListItem
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> list[UserRead]:
    return user_service.list_users(db=db)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> UserRead:
    return user_service.create_user(db=db, payload=payload)


@router.get("/{user_public_id}", response_model=UserRead)
def get_user(
    user_public_id: str,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> UserRead:
    user = user_service.get_user(db=db, user_public_id=user_public_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.delete("/{user_public_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_public_id: str,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> None:
    deleted = user_service.delete_user(db=db, user_public_id=user_public_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")


@router.get("/{user_public_id}/assessments", response_model=list[SkinAssessmentListItem])
def list_user_assessments(
    user_public_id: str,
    limit: int = 30,
    db: Session = Depends(get_db),
    assessment_service: SkinAssessmentService = Depends(get_assessment_service),
) -> list[SkinAssessmentListItem]:
    try:
        return assessment_service.list_user_assessments(
            db=db,
            user_public_id=user_public_id,
            limit=limit,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
