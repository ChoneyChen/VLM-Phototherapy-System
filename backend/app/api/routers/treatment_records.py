from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_treatment_record_service
from app.domain.services.treatment_record_service import TreatmentRecordService
from app.schemas.treatment_record import TreatmentRecordCreate, TreatmentRecordRead, TreatmentRecordStatusUpdate

router = APIRouter(prefix="/treatment-records", tags=["treatment-records"])


@router.get("", response_model=list[TreatmentRecordRead])
def list_treatment_records(
    user_public_id: str = Query(...),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    treatment_record_service: TreatmentRecordService = Depends(get_treatment_record_service),
) -> list[TreatmentRecordRead]:
    try:
        return treatment_record_service.list_user_records(
            db=db,
            user_public_id=user_public_id,
            limit=limit,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=TreatmentRecordRead, status_code=status.HTTP_201_CREATED)
def create_treatment_record(
    payload: TreatmentRecordCreate,
    db: Session = Depends(get_db),
    treatment_record_service: TreatmentRecordService = Depends(get_treatment_record_service),
) -> TreatmentRecordRead:
    try:
        return treatment_record_service.create_record(db=db, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{record_id}/status", response_model=TreatmentRecordRead)
def update_treatment_record_status(
    record_id: str,
    payload: TreatmentRecordStatusUpdate,
    db: Session = Depends(get_db),
    treatment_record_service: TreatmentRecordService = Depends(get_treatment_record_service),
) -> TreatmentRecordRead:
    try:
        record = treatment_record_service.update_status(db=db, record_id=record_id, status=payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment record not found.")
    return record
