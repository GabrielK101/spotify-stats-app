from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import os

router = APIRouter()

@router.get("/login")
def login():
    params = {
        "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
        "response_type": "code",
        "redirect_uri": f"{os.getenv('BACKEND_BASE_URL')}/auth/callback",
        "scope": "user-read-email user-read-private user-read-recently-played",
    }
    url = "https://accounts.spotify.com/authorize?" + urlencode(params)
    return RedirectResponse(url)
