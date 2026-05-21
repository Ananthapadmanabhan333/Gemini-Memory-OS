from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.models import User
from app.core.security import get_password_hash
from app.services.memory_engine import MemoryEngine
from app.api import auth, memory, agents, websocket

# Create DB Tables (Auto-migration)
Base.metadata.create_all(bind=engine)

# Auto-seed guest user for instant local execution
db = SessionLocal()
try:
    guest_user = db.query(User).filter(User.email == "guest@talent.os").first()
    if not guest_user:
        hashed_pwd = get_password_hash("talent_os_2026")
        guest_user = User(
            email="guest@talent.os",
            hashed_password=hashed_pwd,
            full_name="Guest Architect",
            cognitive_decay_rate=0.03,
            preferences={"theme": "cinematic_dark", "local_embeddings": True}
        )
        db.add(guest_user)
        db.commit()
        db.refresh(guest_user)
        
        # Seed initial memories to show off D3 graphs and timelines immediately!
        m1 = MemoryEngine.create_memory(
            db=db,
            user_id=guest_user.id,
            content="Initial research setup completed. Successfully defined cognitive pipelines for Gemini Memory OS.",
            type="semantic",
            importance_score=8.5,
            temporal_tags=["setup", "genesis"]
        )
        
        m2 = MemoryEngine.create_memory(
            db=db,
            user_id=guest_user.id,
            content="Yesterday, I finalized the microservices architecture using FastAPI, Qdrant, and Neo4j.",
            type="episodic",
            importance_score=7.0,
            temporal_tags=["yesterday", "architecture"]
        )
        
        m3 = MemoryEngine.create_memory(
            db=db,
            user_id=guest_user.id,
            content="User preference detected: Highly values dark mode interfaces, neon colors, and glassmorphic HUD overlays.",
            type="procedural",
            importance_score=9.0,
            temporal_tags=["preference", "visual_design"]
        )
        
        m4 = MemoryEngine.create_memory(
            db=db,
            user_id=guest_user.id,
            content="Task checklist generated: complete the D3 graph visualization and integrate the real-time audio waveforms.",
            type="episodic",
            importance_score=6.0,
            temporal_tags=["today", "tasks"]
        )
        
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS parameters
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incorporate API modules
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memory", tags=["Memory Engine"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["Agent Orchestrator"])
app.include_router(websocket.router, prefix=f"{settings.API_V1_STR}/ws", tags=["Real-time Channels"])

@app.get("/")
def root_status():
    return {
        "status": "online",
        "service": "Gemini Memory OS Core",
        "version": settings.VERSION,
        "engine_mode": "dual-fallback-hybrid",
        "active_user": "guest@talent.os",
        "documentation": "/docs"
    }
