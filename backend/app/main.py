from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes_auth import router as auth_router
import os


os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "serviceAccountKey.json"

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