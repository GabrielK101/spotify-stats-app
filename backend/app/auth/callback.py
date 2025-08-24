import requests, datetime, os, jwt
from fastapi import Request, HTTPException, APIRouter
from google.cloud import firestore

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")

def get_firestore_client():
    """Initialize Firestore client with proper credentials"""
    # Set credentials path if not already set
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        # Get path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(current_dir, '..', '..', 'serviceAccountKey.json')
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = service_account_path
    
    return firestore.Client()

@router.get("/callback")
def callback(code: str):
    db = get_firestore_client()  # Create client here instead of module level
    redirect_uri = f"{os.getenv('BACKEND_BASE_URL')}/auth/callback"

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
    token_data = token_res.json()
    if "access_token" not in token_data:
        raise HTTPException(400, f"Token error: {token_data}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")  # may be missing on re-consent
    expires_in = token_data.get("expires_in", 3600)
    expiry_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_in)

    me = requests.get(
        "https://api.spotify.com/v1/me",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    ).json()
    if "id" not in me:
        raise HTTPException(400, f"User error: {me}")

    user_id = me["id"]
    display_name = me.get("display_name", "Unknown")
    profile_pic_url = (me.get("images") or [{}])[0].get("url")

    # persist
    update = {
        "display_name": display_name,
        "access_token": access_token,
        "token_expiry": expiry_time,
        "profile_pic_url": profile_pic_url,
    }
    if refresh_token:  # only overwrite if provided
        update["refresh_token"] = refresh_token

    db.collection("users").document(user_id).set(update, merge=True)

    # issue your own session JWT for frontend → backend calls
    session = jwt.encode(
        {"sub": user_id, "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)},
        JWT_SECRET,
        algorithm="HS256",
    )

    return {"user_id": user_id, "display_name": display_name, "profile_pic_url": profile_pic_url, "token": session}

