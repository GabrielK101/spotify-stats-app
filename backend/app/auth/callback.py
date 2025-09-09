import requests, datetime, os, jwt
import json
from fastapi import Request, HTTPException, APIRouter
from fastapi.responses import RedirectResponse
from google.cloud import firestore
from google.oauth2 import service_account

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")

# TODO: move to standard module and remove weak pathing
def get_firestore_client():
    """Initialize Firestore client with proper credentials"""
    # Check if we have JSON credentials in environment (for Railway deployment)
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if credentials_json:
        try:
            # Parse JSON credentials
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(credentials_info)
            return firestore.Client(credentials=credentials)
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error parsing JSON credentials: {e}")
            # Fall through to file-based method
    
    # Fallback to file-based credentials (for local development)
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(current_dir, '..', '..', 'serviceAccountKey.json')
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = service_account_path
    
    return firestore.Client()

@router.get("/callback")
def callback(code: str):
    db = get_firestore_client()  # Create client here instead of module level
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
        token_res.raise_for_status()  # Raises an HTTPError for bad responses
        token_data = token_res.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(503, f"Failed to connect to Spotify token endpoint: {str(e)}")
    except ValueError as e:  # JSON decode error
        raise HTTPException(502, f"Invalid response from Spotify token endpoint: {str(e)}")
    
    if "access_token" not in token_data:
        raise HTTPException(400, f"Token error: {token_data}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")  # may be missing on re-consent
    expires_in = token_data.get("expires_in", 3600)
    expiry_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_in)

    try:
        me_response = requests.get(
            "https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        me_response.raise_for_status()  # Raises an HTTPError for bad responses
        me = me_response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(503, f"Failed to fetch user profile from Spotify: {str(e)}")
    except ValueError as e:  # JSON decode error
        raise HTTPException(502, f"Invalid user profile response from Spotify: {str(e)}")
    
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

    # Redirect to frontend callback with token and user_id
    frontend_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    redirect_to = f"{frontend_url}/callback?token={session}&user_id={user_id}"
    return RedirectResponse(redirect_to)