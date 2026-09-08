from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models # Register all models

# Create database tables automatically
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed demo data on first boot if database has no records
    try:
        from app.core.database import SessionLocal
        from app.models.record import SourceRecord
        from app.api.reconciliation import load_and_run_demo
        db = SessionLocal()
        try:
            if db.query(SourceRecord).count() == 0:
                print("Database is empty. Auto-seeding initial demo data...")
                load_and_run_demo(db)
                print("Auto-seed completed successfully!")
        finally:
            db.close()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Evidence-First Record Reconciliation Platform",
    version="1.0.0",
    lifespan=lifespan
)


# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and attach routers
from app.api.sources import router as sources_router
from app.api.reconciliation import router as reconciliation_router
from app.api.entities import router as entities_router
from app.api.evidence import router as evidence_router
from app.api.copilot import router as copilot_router
from app.api.review import router as review_router
from app.api.audit import router as audit_router
from app.api.dashboard import router as dashboard_router
from app.api.settings import router as settings_router

app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(sources_router, prefix=settings.API_V1_STR)
app.include_router(reconciliation_router, prefix=settings.API_V1_STR)
app.include_router(entities_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(copilot_router, prefix=settings.API_V1_STR)
app.include_router(review_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
