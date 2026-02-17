# Full Stack Integration Setup

This guide connects your Frontend → Next.js Orchestrator → Python AI Service

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                      │
│ Port: 3000                                              │
│ URL: http://localhost:3000                              │
└────────────┬────────────────────────────────────────────┘
             │ HTTP Requests
             ▼
┌─────────────────────────────────────────────────────────┐
│ Next.js Orchestrator (API Layer)                       │
│ Port: 3001                                              │
│ URL: http://localhost:3001                              │
│ - Google Calendar integration                           │
│ - Supabase data enrichment                             │
│ - API routing                                           │
└────────────┬────────────────────────────────────────────┘
             │ Forwards AI requests
             ▼
┌─────────────────────────────────────────────────────────┐
│ Python AI Service (FastAPI)                            │
│ Port: 8000                                              │
│ URL: http://localhost:8000                              │
│ - 4 AI Agents                                          │
│ - Scheduling logic                                      │
│ - ScaleDown compression                                 │
└─────────────────────────────────────────────────────────┘
```

## Quick Start (All Services)

### Option 1: Automated Startup (Recommended)

```powershell
# Windows PowerShell
.\start_all_services.ps1
```

This will start all three services in separate terminal windows.

### Option 2: Manual Startup

**Terminal 1 - Python AI Service:**
```powershell
cd python-service
python main.py
# Runs on http://localhost:8000
```

**Terminal 2 - Next.js Orchestrator:**
```powershell
cd nextjs-orchestrator
npm install  # First time only
npm run dev -- -p 3001
# Runs on http://localhost:3001
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm install  # First time only
npm run dev
# Runs on http://localhost:3000
```

## Environment Setup

### 1. Python Service (.env)

Create `python-service/.env`:

```env
# ScaleDown API for LLM compression
SCALEDOWN_API_KEY=uQgzcIbeJ62BmqhwRcYgk3knNzJ9ymE34vSPAjE9
SCALEDOWN_ENABLE=true

# Service Configuration
LOG_LEVEL=INFO
```

### 2. Next.js Orchestrator (.env.local)

Create `nextjs-orchestrator/.env.local`:

```env
# Python AI Brain Service
PYTHON_SERVICE_URL=http://localhost:8000
REQUEST_TIMEOUT_MS=30000

# Supabase Configuration (optional - for calendar persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (optional - for calendar integration)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Database persistence (optional)
ENABLE_DATABASE_PERSISTENCE=false

# Next.js
NODE_ENV=development
```

### 3. Frontend (.env.local)

Create/Update `frontend/.env.local`:

```env
# API Configuration - Points to Orchestrator
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Optional: Google OAuth Client ID (if using authentication)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## API Endpoints

### Frontend → Orchestrator

Frontend calls these endpoints on the orchestrator:

- `POST /api/schedule` - Create schedule with AI
- `POST /api/schedule/recommendations` - Get recommendations
- `GET /api/calendar/sync` - Sync Google Calendar
- `POST /api/calendar/write-back` - Write events to calendar
- `POST /api/recurring/analyze` - Analyze recurring meetings
- `GET /api/auth/google/initiate` - Start OAuth flow
- `GET /api/auth/google/callback` - OAuth callback

### Orchestrator → Python Service

Orchestrator forwards to Python AI:

- `POST http://localhost:8000/schedule` - AI scheduling
- `GET http://localhost:8000/health` - Health check
- `GET http://localhost:8000/scaledown/stats` - Compression stats

## Testing the Integration

### 1. Health Check (All Services)

```powershell
# Test Python service
curl http://localhost:8000/health

# Test Orchestrator
curl http://localhost:3001/api/schedule

# Test Frontend
# Visit http://localhost:3000 in browser
```

### 2. Test Scheduling API

```powershell
# Test the full pipeline
curl -X POST http://localhost:3001/api/schedule `
  -H "Content-Type: application/json" `
  -d @test_schedule_request.json
```

### 3. Browser Test

1. Open http://localhost:3000
2. Go to "Quick Schedule" page
3. Fill in meeting details
4. Click "Find Times"
5. Should see AI-generated recommendations

## Troubleshooting

### Port Already in Use

```powershell
# Find what's using a port
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Python Service Won't Start

```powershell
cd python-service
pip install -r requirements.txt
python -c "import fastapi; print('FastAPI OK')"
python main.py
```

### Orchestrator Connection Error

Check that Python service is running:
```powershell
curl http://localhost:8000/health
```

Update `nextjs-orchestrator/.env.local`:
```env
PYTHON_SERVICE_URL=http://localhost:8000
```

### Frontend Can't Connect

Check that orchestrator is running:
```powershell
curl http://localhost:3001/api/schedule
```

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### CORS Errors

The Python service allows all origins by default. If you see CORS errors, check:

1. Frontend environment: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
2. Orchestrator environment: `PYTHON_SERVICE_URL=http://localhost:8000`
3. All services are running on correct ports

## Development Workflow

### Making Changes

**Frontend Changes:**
- Edit files in `frontend/`
- Hot reload automatic (Next.js dev server)
- Check browser console for errors

**Orchestrator Changes:**
- Edit files in `nextjs-orchestrator/src/`
- Hot reload automatic
- Check terminal for TypeScript errors

**Python Service Changes:**
- Edit files in `python-service/`
- Restart service: `Ctrl+C` then `python main.py`
- Or use `uvicorn main:app --reload`

### Adding New Features

1. **Add API Endpoint (Orchestrator)**:
   ```typescript
   // nextjs-orchestrator/src/app/api/my-feature/route.ts
   export async function POST(request: NextRequest) {
     // Your logic
   }
   ```

2. **Update Frontend API Client**:
   ```typescript
   // frontend/lib/api.ts
   async myFeature(data: any) {
     return await this.client.post('/api/my-feature', data)
   }
   ```

3. **Use in Frontend Component**:
   ```typescript
   import { useApi } from '@/hooks/use-api'
   
   const api = useApi()
   const result = await api.myFeature(data)
   ```

## Deployment

### Production Considerations

1. **Environment Variables**: Never commit `.env.local` files
2. **CORS**: Configure allowed origins in Python service
3. **SSL**: Use HTTPS in production
4. **Ports**: May need to use different ports in production

### Deploy to Vercel (Frontend + Orchestrator)

```bash
# Deploy frontend
cd frontend
vercel

# Deploy orchestrator
cd nextjs-orchestrator
vercel
```

### Deploy Python Service (Railway/Render)

```bash
cd python-service
# Follow platform-specific instructions
```

## Performance Tips

1. **Enable Caching**: Orchestrator can cache calendar data
2. **Database**: Use Supabase for persistence
3. **Compression**: ScaleDown reduces AI token usage
4. **Connection Pooling**: For high traffic

## Need Help?

- Check logs in each terminal
- Use `python demo_agents.py` to test Python service standalone
- Check browser DevTools Network tab
- Verify all ports are correct
- Ensure all dependencies are installed
