Environment Variables:

SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
BACKEND_BASE_URL=http://localhost:8000
FRONTEND_BASE_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
DATABASE_URL=postgresql://username:password@localhost:5432/database_name


To start up your FastAPI backend, you need to:

Navigate to the backend directory:
Activate your virtual environment:
.venv\Scripts\Activate.ps1
Start the FastAPI development server:
fastapi dev app/main.py
