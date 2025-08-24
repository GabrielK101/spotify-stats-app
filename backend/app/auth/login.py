from fastapi import APIRouter
from urllib.parse import urlencode
import os

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/login")
def login():
    params = {
        "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
        "response_type": "code",
        "redirect_uri": f"{os.getenv('BACKEND_BASE_URL')}/auth/callback",
        "scope": "user-read-email user-read-private user-read-recently-played",
    }
    url = "https://accounts.spotify.com/authorize?" + urlencode(params)
    return {"authorize_url": url}
