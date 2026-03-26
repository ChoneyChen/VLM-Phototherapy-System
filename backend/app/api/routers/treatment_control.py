from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_treatment_control_service
from app.domain.services.treatment_control_service import TreatmentControlService
from app.schemas.control import (
    TreatmentControlOptionsResponse,
    TreatmentControlPresetRequest,
    TreatmentControlSessionResponse,
)

router = APIRouter(prefix="/treatment-control", tags=["treatment-control"])


@router.get("/options", response_model=TreatmentControlOptionsResponse)
def get_treatment_control_options(
    treatment_control_service: TreatmentControlService = Depends(get_treatment_control_service),
) -> TreatmentControlOptionsResponse:
    return treatment_control_service.get_control_options()


@router.post("/preset", response_model=TreatmentControlSessionResponse, status_code=status.HTTP_200_OK)
def create_treatment_control_preset(
    payload: TreatmentControlPresetRequest,
    db: Session = Depends(get_db),
    treatment_control_service: TreatmentControlService = Depends(get_treatment_control_service),
) -> TreatmentControlSessionResponse:
    try:
        return treatment_control_service.build_control_session(
            db=db,
            assessment_id=payload.assessment_id,
            zone_name=payload.zone_name,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
