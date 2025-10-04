import requests
import datetime
import os
import jwt
from fastapi import Request, HTTPException, APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..services.db_service import DBService

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")

@router.get("/callback")
def callback(code: str, db: Session = Depends(get_db)):
    print(f"=== CALLBACK STARTED: Received code: {code[:20]}... ===")
    redirect_uri = f"{os.getenv('BACKEND_BASE_URL', 'http://localhost:8000')}/auth/callback"

    try:
        token_res = requests.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
                "client_secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
            },
            timeout=15,
        )
        token_res.raise_for_status()
        token_data = token_res.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(503, f"Failed to connect to Spotify token endpoint: {str(e)}")
    except ValueError as e:
        raise HTTPException(502, f"Invalid response from Spotify token endpoint: {str(e)}")
    
    if "access_token" not in token_data:
        raise HTTPException(400, f"Token error: {token_data}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)
    expiry_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_in)

    try:
        me_response = requests.get(
            "https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        me_response.raise_for_status()
        me = me_response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(503, f"Failed to fetch user profile from Spotify: {str(e)}")
    except ValueError as e:
        raise HTTPException(502, f"Invalid user profile response from Spotify: {str(e)}")
    
    if "id" not in me:
        raise HTTPException(400, f"User error: {me}")

    user_id = me["id"]
    display_name = me.get("display_name", "Unknown")
    profile_pic_url = (me.get("images") or [{}])[0].get("url")

    # Save to SQL database
    # Save to SQL database
    user_data = {
        "user_id": user_id,
        "display_name": display_name,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expiry": expiry_time,
        "profile_pic_url": profile_pic_url,
    }
    
    print(f"Attempting to save user: {user_id}")
    try:
        DBService.upsert_user(db, user_data)
        print(f"Successfully saved user: {user_id}")
    except Exception as e:
        print(f"Error saving user: {e}")
        import traceback
        traceback.print_exc()
        raise

    # Issue JWT for frontend → backend calls
    session = jwt.encode(
        {"sub": user_id, "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)},
        JWT_SECRET,
        algorithm="HS256",
    )

    # Redirect to frontend callback with token and user_id
    frontend_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    redirect_to = f"{frontend_url}/callback?token={session}&user_id={user_id}"
    return RedirectResponse(redirect_to)