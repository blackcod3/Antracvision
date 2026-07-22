from pydantic import BaseModel, Field


class CreateUserRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    username: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(min_length=1, max_length=50)


class UpdateUserRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    username: str = Field(min_length=3, max_length=120)
    role: str = Field(min_length=1, max_length=50)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class SetUserActiveRequest(BaseModel):
    is_active: bool
