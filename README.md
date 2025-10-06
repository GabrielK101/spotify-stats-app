# 🎵 Spotify Stats App

A comprehensive Spotify analytics platform with AI-powered music insights, built with React, FastAPI, and Cloudflare Workers AI.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  AI Worker      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│ (Cloudflare)    │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Spotify API   │    │ • LLM Chat      │
│ • Auth Flow     │    │ • PostgreSQL    │    │ • Data Analysis │
│ • AI Chat UI    │    │ • Scheduled     │    │ • Conversation  │
│                 │    │   Polling       │    │   Memory        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 🌐 Using Deployed Services (Recommended)

The latest backend and AI services are already deployed so to run the project you just need to run the frontend locally.
Most users will want to run only the frontend locally while using our deployed backend and AI services:

**Prerequisites:**
- Node.js 18+ and npm
- Spotify Developer Account (for your own app)

**Setup:**
```bash
# Clone the repository
git clone <repository-url>
cd spotify-stats-app/frontend

# Install dependencies
npm install

# Start development server, from the /frontend directory
npm run dev
```

Your `.env` file should look like:
```env
# Use deployed services
VITE_AI_WORKER_URL=https://spotify-ai-worker.gabekanjama.workers.dev
VITE_API_URL=https://spotify-stats-app-production.up.railway.app
```

## 📁 Project Structure

```
spotify-stats-app/
├── frontend/                 # React frontend application
|
├── backend/                 # FastAPI backend server
|
└── agent/                  # AI worker (Cloudflare)
```

## 🔄 How It Works

1. **Authentication**: Users log in with Spotify OAuth
2. **Data Collection**: Backend polls Spotify API hourly for listening history
3. **Analytics**: Data is processed and stored in PostgreSQL
4. **Visualization**: Frontend displays charts and statistics
5. **AI Insights**: Users can chat with AI for personalized music insights

