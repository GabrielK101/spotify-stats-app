import requests, datetime, os
from fastapi import HTTPException
from google.cloud import firestore

db = firestore.Client()

def get_valid_access_token(user_id: str) -> str:
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(404, "User not found")
    user = doc.to_dict()
    exp = user.get("token_expiry")
    now = datetime.datetime.utcnow()
    if exp and isinstance(exp, datetime.datetime) and exp > now:
        return user["access_token"]

    # refresh
    rt = user.get("refresh_token")
    if not rt:
        raise HTTPException(401, "No refresh token")
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": rt,
            "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
            "client_secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
        },
        timeout=15,
    ).json()
    if "access_token" not in r:
        raise HTTPException(401, f"Refresh failed: {r}")

    access = r["access_token"]
    expires_in = r.get("expires_in", 3600)
    expiry_time = now + datetime.timedelta(seconds=expires_in)
    update = {"access_token": access, "token_expiry": expiry_time}
    if "refresh_token" in r:  # sometimes rotated
        update["refresh_token"] = r["refresh_token"]
    db.collection("users").document(user_id).update(update)
    return access
