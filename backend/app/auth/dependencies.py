from fastapi import Header, Depends, HTTPException, APIRouter
import os, jwt
from google.cloud import firestore

router = APIRouter()
db = firestore.Client()
JWT_SECRET = os.getenv("JWT_SECRET")

def current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]  # user_id
    except Exception:
        raise HTTPException(401, "Invalid token")

@router.get("/me")
def me(user_id: str = Depends(current_user)):
    doc = db.collection("users").document(user_id).get()
    return {"user_id": user_id, **(doc.to_dict() or {})}
