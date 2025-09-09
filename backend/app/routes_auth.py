from fastapi import APIRouter, Request
from .auth.login import login
from .auth.callback import callback

router = APIRouter(prefix="/auth")

router.get("/login")(login)
router.get("/callback")(callback)
