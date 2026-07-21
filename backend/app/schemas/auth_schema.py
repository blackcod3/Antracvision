from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    current_password: str | None = None
    new_password: str | None = None
