import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routers import assessments, health, users
from app.core.bootstrap import initialize_application
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(assessments.router, prefix=settings.api_prefix)
app.mount(
    "/files",
    StaticFiles(directory=str(settings.backend_dir / "data"), check_dir=False),
    name="files",
)


@app.on_event("startup")
def startup() -> None:
    initialize_application()


def run() -> None:
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    run()
