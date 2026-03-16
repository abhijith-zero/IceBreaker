from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from api.routes import health, progress, scenarios, sessions, tokens
from core.logging import setup_logging
from core.middleware import RequestLoggingMiddleware

settings = get_settings()
setup_logging(level=settings.LOG_LEVEL if hasattr(settings, "LOG_LEVEL") else "INFO")

app = FastAPI(
    title="Icebreaker API",
    description="Real-time networking practice backend",
    version="0.1.0"
)


# CORS — allows React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

# Routers
app.include_router(health.router, tags=["Health"])
app.include_router(scenarios.router, tags=["Scenarios"])
app.include_router(tokens.router, tags=["Tokens"])
app.include_router(sessions.router,  tags=["Sessions"])
app.include_router(progress.router,  tags=["Progress"])
