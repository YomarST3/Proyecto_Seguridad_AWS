from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str
    company_id: int


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    company_id: int
    is_active: bool

    class Config:
        from_attributes = True
