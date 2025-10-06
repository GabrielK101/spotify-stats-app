# 🤖 Spotify AI Assistant Worker

A Cloudflare Workers-based AI assistant that provides personalized music insights using Cloudflare's AI models. This worker serves as the intelligent backend for the chat interface in the Spotify Stats App.

## Features

- **Smart Data Analysis** - Analyzes user messages to determine what music data to fetch
- **Conversational Memory** - Maintains conversation history using Durable Objects

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat UI       │    │  AI Worker      │    │   Backend API   │
│   (Frontend)    │◄──►│ (Cloudflare)    │◄──►│   (Railway)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Durable Objects │
                       │  (Memory)       │
                       └─────────────────┘
```



## 🚀 Deployment

### Prerequisites

- Cloudflare account with Workers plan
- Wrangler CLI installed: `npm install -g wrangler`
- Authentication: `wrangler auth login`

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Test the worker locally
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "What did I listen to recently?",
    "userData": {"display_name": "Test User"}
  }'
```

