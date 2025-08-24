from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes_auth import router as auth_router
import os

app = FastAPI()
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