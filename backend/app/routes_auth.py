from fastapi import APIRouter, Request
from app.auth.login import spotify_login, spotify_callback  

router = APIRouter(prefix="/auth")

router.get("/login")(spotify_login)
router.get("/callback")(spotify_callback)
