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

@app.get("/api/user/{user_id}/recent-tracks")
def get_recent_tracks(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """Get recent tracks for AI analysis"""
    history = DBService.get_user_listening_history(db, user_id, limit, 0)
    user = DBService.get_user(db, user_id)
    
    return {
        "user": {
            "id": user.user_id if user else user_id,
            "name": user.display_name if user else "Unknown"
        },
        "recent_tracks": [
            {
                "track": h.track_name,
                "artist": h.artist_name,
                "album": h.album_name,
                "played_at": h.played_at.strftime('%Y-%m-%d %H:%M'),
            }
            for h in history
        ],
        "track_count": len(history)
    }

@app.get("/api/user/{user_id}/top-artists")
def get_top_artists(user_id: str, limit: int = 10, timeframe: str = "month", db: Session = Depends(get_db)):
    """Get top artists for a user"""
    # This would need to be implemented in DBService
    # For now, return a placeholder
    return {
        "user_id": user_id,
        "timeframe": timeframe,
        "top_artists": []  # TODO: Implement top artists logic
    }

@app.get("/api/user/{user_id}/listening-stats")
def get_listening_stats(user_id: str, timeframe: str = "week", db: Session = Depends(get_db)):
    """Get listening statistics for a user"""
    # This would need to be implemented in DBService
    # For now, return a placeholder
    return {
        "user_id": user_id,
        "timeframe": timeframe,
        "total_minutes": 0,  # TODO: Calculate from listening history
        "total_tracks": 0,
        "unique_artists": 0,
        "avg_daily_minutes": 0
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

@app.get("/api/user/{user_id}/complete-data")
def get_complete_user_data(user_id: str, db: Session = Depends(get_db)):
    """Get all user music data for AI context"""
    from collections import Counter
    from datetime import datetime, timedelta
    
    # Get user info
    user = DBService.get_user(db, user_id)
    if not user:
        return {"error": "User not found"}
    
    # Get all listening history (we'll limit and process it)
    all_history = DBService.get_user_listening_history(db, user_id, limit=500)
    
    if not all_history:
        return {"error": "No listening history found"}
    
    # Recent tracks (last 50)
    recent_tracks = []
    for h in all_history[:50]:
        recent_tracks.append({
            "track": h.track_name,
            "artist": h.artist_name,
            "album": h.album_name,
            "played_at": h.played_at.strftime("%Y-%m-%d %H:%M"),
        })
    
    # Calculate top artists
    artist_counts = Counter([h.artist_name for h in all_history])
    top_artists = [
        {"name": artist, "play_count": count}
        for artist, count in artist_counts.most_common(20)
    ]
    
    # Calculate listening statistics
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Week stats
    week_tracks = [h for h in all_history if h.played_at >= week_ago]
    week_minutes = sum(h.duration_ms for h in week_tracks if h.duration_ms) / (1000 * 60)
    week_unique_artists = len(set(h.artist_name for h in week_tracks))
    
    # Month stats
    month_tracks = [h for h in all_history if h.played_at >= month_ago]
    month_minutes = sum(h.duration_ms for h in month_tracks if h.duration_ms) / (1000 * 60)
    month_unique_artists = len(set(h.artist_name for h in month_tracks))
    
    # All time stats
    total_minutes = sum(h.duration_ms for h in all_history if h.duration_ms) / (1000 * 60)
    total_unique_artists = len(set(h.artist_name for h in all_history))
    
    # Genre analysis (simplified - based on artist diversity)
    recent_artists = [h.artist_name for h in all_history[:100]]
    artist_variety = len(set(recent_artists)) / len(recent_artists) if recent_artists else 0
    
    # Top albums
    album_counts = Counter([f"{h.album_name} by {h.artist_name}" for h in all_history if h.album_name])
    top_albums = [
        {"album_artist": album, "play_count": count}
        for album, count in album_counts.most_common(10)
    ]
    
    return {
        "user": {
            "id": user_id,
            "name": user.display_name,
            "total_tracks_in_history": len(all_history)
        },
        "recent_tracks": recent_tracks,
        "top_artists": top_artists,
        "top_albums": top_albums,
        "listening_stats": {
            "week": {
                "total_minutes": round(week_minutes, 1),
                "total_tracks": len(week_tracks),
                "unique_artists": week_unique_artists,
                "avg_daily_minutes": round(week_minutes / 7, 1)
            },
            "month": {
                "total_minutes": round(month_minutes, 1),
                "total_tracks": len(month_tracks),
                "unique_artists": month_unique_artists,
                "avg_daily_minutes": round(month_minutes / 30, 1)
            },
            "all_time": {
                "total_minutes": round(total_minutes, 1),
                "total_tracks": len(all_history),
                "unique_artists": total_unique_artists,
                "artist_variety_score": round(artist_variety, 2)
            }
        }
    }