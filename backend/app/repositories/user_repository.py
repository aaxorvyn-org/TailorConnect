from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.user import UserRegister


class UserRepository(BaseRepository[User, UserRegister, UserRegister]):
    """
    Data access repository for User entities.
    """

    def __init__(self):
        super().__init__(User)

    def get_by_id(self, db: Session, user_id: Any) -> Optional[User]:
        return self.get(db, user_id)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.strip().lower()).first()

    def create_user(
        self,
        db: Session,
        *,
        user_in: UserRegister,
        hashed_password: str,
    ) -> User:
        user_data = user_in.model_dump(exclude={"password", "admin_secret"})
        db_user = User(
            **user_data,
            hashed_password=hashed_password,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


user_repository = UserRepository()
