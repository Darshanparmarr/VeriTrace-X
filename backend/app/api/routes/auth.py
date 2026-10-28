"""Authentication endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.ratelimit import rate_limit
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_for(user: User) -> Token:
    access = create_access_token(user.id, extra={"role": user.role.value})
    return Token(
        access_token=access,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserOut.model_validate(user),
    )


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(20, 60, "register"))],
)
def register(data: UserCreate, db: Session = Depends(get_db)) -> Token:
    user = auth_service.register_user(db, data)
    return _token_for(user)


@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit(20, 60, "login"))],
)
def login(data: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = auth_service.authenticate(db, data.email, data.password)
    return _token_for(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
