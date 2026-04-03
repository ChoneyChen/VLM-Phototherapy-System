from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_treatment_plan_service
from app.domain.services.treatment_plan_service import TreatmentPlanService
from app.schemas.treatment_plan import TreatmentPlanDetail, TreatmentPlanGenerateRequest, TreatmentPlanListItem

router = APIRouter(prefix="/treatment-plans", tags=["treatment-plans"])


@router.get("", response_model=list[TreatmentPlanListItem])
def list_treatment_plans(
    user_public_id: str = Query(...),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    treatment_plan_service: TreatmentPlanService = Depends(get_treatment_plan_service),
) -> list[TreatmentPlanListItem]:
    try:
        return treatment_plan_service.list_user_plans(
            db=db,
            user_public_id=user_public_id,
            limit=limit,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=TreatmentPlanDetail, status_code=status.HTTP_201_CREATED)
def create_treatment_plan(
    payload: TreatmentPlanGenerateRequest,
    db: Session = Depends(get_db),
    treatment_plan_service: TreatmentPlanService = Depends(get_treatment_plan_service),
) -> TreatmentPlanDetail:
    try:
        return treatment_plan_service.generate_plan_from_assessment(
            db=db,
            assessment_id=payload.assessment_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{plan_id}", response_model=TreatmentPlanDetail)
def get_treatment_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    treatment_plan_service: TreatmentPlanService = Depends(get_treatment_plan_service),
) -> TreatmentPlanDetail:
    plan = treatment_plan_service.get_plan_detail(db=db, plan_id=plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found.")
    return plan
