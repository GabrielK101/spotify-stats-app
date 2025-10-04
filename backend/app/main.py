from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from contextlib import asynccontextmanager

from .db.database import engine, get_db
from .db.models import Base
from .scheduler import start_scheduler, stop_scheduler
from .routes_auth import router as auth_router
from .services.db_service import DBService

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Starting up...")
    start_scheduler()  # Start the hourly polling
    yield
    # Shutdown
    print("Shutting down...")
    stop_scheduler()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth_router)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/user/{user_id}/history")
def get_user_history(user_id: str, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    """Get listening history for a user"""
    history = DBService.get_user_listening_history(db, user_id, limit, offset)
    return {
        "user_id": user_id,
        "tracks": [
            {
                "track_id": h.track_id,
                "track_name": h.track_name,
                "artist_name": h.artist_name,
                "artist_id": h.artist_id,
                "album_name": h.album_name,
                "played_at": h.played_at.isoformat(),
                "duration_ms": h.duration_ms,
                "image_url": h.image_url,
            }
            for h in history
        ],
        "limit": limit,
        "offset": offset,
    }

@app.post("/api/admin/poll/{user_id}")
def manual_poll_user(user_id: str, db: Session = Depends(get_db)):
    """Manually trigger a poll for a specific user (for testing)"""
    from .services.spotify_poller import SpotifyPoller
    result = SpotifyPoller.poll_user(db, user_id)
    return result

@app.post("/api/admin/poll-all")
def manual_poll_all():
    """Manually trigger a poll for all users (for testing)"""
    from .services.spotify_poller import SpotifyPoller
    results = SpotifyPoller.poll_all_users()
    return {
        "total": len(results),
        "successful": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "results": results
    }

@app.get("/api/user/{user_id}/recent-tracks")
def get_recent_tracks_for_ai(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """Get recent tracks formatted for AI"""
    history = DBService.get_user_listening_history(db, user_id, limit=limit)
    
    if not history:
        return {"error": "No listening history found"}
    
    # Format for AI consumption
    tracks = []
    for h in history:
        tracks.append({
            "track": h.track_name,
            "artist": h.artist_name,
            "album": h.album_name,
            "played_at": h.played_at.strftime("%Y-%m-%d %H:%M"),
        })
    
    # Get user info
    user = DBService.get_user(db, user_id)
    
    return {
        "user": {
            "id": user_id,
            "name": user.display_name if user else "Unknown"
        },
        "recent_tracks": tracks,
        "track_count": len(tracks)
    }