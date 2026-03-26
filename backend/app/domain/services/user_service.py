from sqlalchemy.orm import Session

from app.infrastructure.db.repositories import UserRepository
from app.schemas.user import UserCreate, UserRead


class UserService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def list_users(self, db: Session) -> list[UserRead]:
        return [UserRead.model_validate(user) for user in self.user_repository.list_users(db=db)]

    def create_user(self, db: Session, payload: UserCreate) -> UserRead:
        user = self.user_repository.create(
            db=db,
            name=payload.name.strip(),
            notes=(payload.notes or "").strip() or None,
        )
        return UserRead.model_validate(user)

    def get_user(self, db: Session, user_public_id: str) -> UserRead | None:
        user = self.user_repository.get_by_public_id(db=db, user_public_id=user_public_id)
        return None if user is None else UserRead.model_validate(user)

    def delete_user(self, db: Session, user_public_id: str) -> bool:
        return self.user_repository.delete_by_public_id(db=db, user_public_id=user_public_id)
