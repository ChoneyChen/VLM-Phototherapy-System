from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    sequence_number: int
    name: str
    notes: str | None
    created_at: datetime
