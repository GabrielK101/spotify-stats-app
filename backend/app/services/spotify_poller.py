import os
import requests
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ..db.database import get_db_context
from ..services.db_service import DBService

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

class SpotifyPoller:
    @staticmethod
    def refresh_access_token(db: Session, user_id: str, refresh_token: str) -> Optional[str]:
        """Refresh Spotify access token"""
        try:
            response = requests.post(
                "https://accounts.spotify.com/api/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": SPOTIFY_CLIENT_ID,
                    "client_secret": SPOTIFY_CLIENT_SECRET,
                },
                timeout=15,
            )
            response.raise_for_status()
            token_data = response.json()
            
            if "access_token" not in token_data:
                print(f"Failed to refresh token for {user_id}: {token_data}")
                return None
            
            access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 3600)
            expiry_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_in)
            
            # Update token in database
            new_refresh_token = token_data.get("refresh_token")
            DBService.update_user_tokens(db, user_id, access_token, expiry_time, new_refresh_token)
            
            return access_token
            
        except Exception as e:
            print(f"Error refreshing token for {user_id}: {e}")
            return None
    
    @staticmethod
    def get_recently_played(access_token: str, limit: int = 50) -> Optional[Dict[str, Any]]:
        """Fetch recently played tracks from Spotify"""
        try:
            response = requests.get(
                "https://api.spotify.com/v1/me/player/recently-played",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"limit": limit},
                timeout=15,
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Spotify API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error fetching recently played: {e}")
            return None
    
    @staticmethod
    def parse_tracks_data(spotify_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Spotify API response into our database format"""
        tracks = []
        
        if not spotify_data or "items" not in spotify_data:
            return tracks
        
        for item in spotify_data["items"]:
            track = item.get("track", {})
            album = track.get("album", {})
            artists = track.get("artists", [])
            images = album.get("images", [])
            
            played_at_str = item.get("played_at")
            if played_at_str:
                # Parse ISO format timestamp
                played_at = datetime.datetime.strptime(
                    played_at_str.replace('Z', '+00:00'),
                    "%Y-%m-%dT%H:%M:%S.%f%z"
                )
            else:
                continue
            
            track_data = {
                "track_id": track.get("id"),
                "track_name": track.get("name"),
                "artist_name": artists[0].get("name") if artists else None,
                "artist_id": artists[0].get("id") if artists else None,
                "album_name": album.get("name"),
                "played_at": played_at,
                "duration_ms": track.get("duration_ms"),
                "image_url": images[0].get("url") if images else None,
            }
            tracks.append(track_data)
        
        return tracks
    
    @staticmethod
    def poll_user(db: Session, user_id: str) -> Dict[str, Any]:
        """Poll listening history for a single user"""
        result = {
            "user_id": user_id,
            "success": False,
            "tracks_saved": 0,
            "error": None
        }
        
        user = DBService.get_user(db, user_id)
        if not user:
            result["error"] = "User not found"
            return result
        
        # Check if token needs refresh
        access_token = user.access_token
        now = datetime.datetime.now(datetime.timezone.utc)
        
        if not access_token or not user.token_expiry or user.token_expiry <= now:
            if not user.refresh_token:
                result["error"] = "No refresh token available"
                return result
            
            access_token = SpotifyPoller.refresh_access_token(db, user_id, user.refresh_token)
            if not access_token:
                result["error"] = "Failed to refresh token"
                return result
        
        # Fetch recently played tracks
        spotify_data = SpotifyPoller.get_recently_played(access_token)
        if not spotify_data:
            result["error"] = "Failed to fetch recently played"
            return result
        
        # Parse and save tracks
        tracks = SpotifyPoller.parse_tracks_data(spotify_data)
        if tracks:
            tracks_saved = DBService.save_listening_history(db, user_id, tracks)
            result["tracks_saved"] = tracks_saved
            result["success"] = True
        else:
            result["error"] = "No tracks found"
        
        return result
    
    @staticmethod
    def poll_all_users() -> List[Dict[str, Any]]:
        """Poll listening history for all active users"""
        results = []
        
        with get_db_context() as db:
            users = DBService.get_all_active_users(db)
            print(f"Polling {len(users)} users...")
            
            for user in users:
                try:
                    result = SpotifyPoller.poll_user(db, user.user_id)
                    results.append(result)
                    
                    if result["success"]:
                        print(f"✓ {user.user_id}: {result['tracks_saved']} new tracks")
                    else:
                        print(f"✗ {user.user_id}: {result['error']}")
                        
                except Exception as e:
                    print(f"Error polling user {user.user_id}: {e}")
                    results.append({
                        "user_id": user.user_id,
                        "success": False,
                        "error": str(e)
                    })
        
        return results