"""General Pydantic schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class StatsResponse(BaseModel):
    total: int
    movies: int
    music: int
    books: int

