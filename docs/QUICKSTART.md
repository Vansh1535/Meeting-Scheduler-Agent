# Quick Start - Full Stack Integration

## 🚀 Start All Services (Easiest Way)

```powershell
# From project root
.\start_all_services.ps1
```

This launches all three services in separate windows:
- **Python AI Service** (port 8000)
- **Next.js Orchestrator** (port 3001)
- **Frontend** (port 3000)

## ✅ Test Integration

```powershell
# Wait 10 seconds after starting services, then run:
.\test_integration.ps1
```

Expected output:
```
[1/4] Testing Python AI Service... ✓ PASS
[2/4] Testing Next.js Orchestrator... ✓ PASS
[3/4] Testing Full Pipeline... ✓ PASS
[4/4] Testing Frontend... ✓ PASS

ALL TESTS PASSED ✓
```

## 🌐 Access Points

Once all services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | User interface |
| **Orchestrator API** | http://localhost:3001 | API endpoints |
| **Python AI** | http://localhost:8000 | AI agents |

## 📝 Manual Testing

### Test Python Service

```powershell
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "agents": {
    "availability": "active",
    "preference": "active",
    "optimization": "active",
    "negotiation": "active"
  }
}
```

### Test Orchestrator → Python Pipeline

```powershell
curl -X POST http://localhost:3001/api/schedule `
  -H "Content-Type: application/json" `
  -d @test_integration_request.json
```

Expected response:
```json
{
  "meeting_id": "test-meeting-001",
  "candidates": [
    {
      "slot": { "start": "2026-02-17T11:00:00Z", ... },
      "score": 87.6,
      "reasoning": "Excellent match; all participants available..."
    }
  ],
  "processing_time_ms": 12.5
}
```

### Test Frontend

Open browser: http://localhost:3000

Navigate to "Quick Schedule" and test the UI.

## 🛠️ Troubleshooting

### Services Won't Start

**Check ports:**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :8000
```

**Kill existing processes:**
```powershell
# Get process ID from netstat, then:
taskkill /PID <PID> /F
```

### Python Service Errors

```powershell
cd python-service
pip install -r requirements.txt
python demo_agents.py  # Test standalone first
python main.py
```

### Orchestrator Connection Error

Check `.env.local` in `nextjs-orchestrator/`:
```env
PYTHON_SERVICE_URL=http://localhost:8000
```

Verify Python service is running:
```powershell
curl http://localhost:8000/health
```

### Frontend Can't Connect

Check `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Verify orchestrator is running:
```powershell
curl http://localhost:3001/api/schedule
# Should return 405 Method Not Allowed (which is correct - it needs POST)
```

### Port Already in Use

Change ports in startup script or kill the process:

**Python**: Edit `python-service/main.py`, change port to 8001
**Orchestrator**: Run with `npm run dev -- -p 3002`
**Frontend**: Run with `npm run dev -- -p 3001`

## 📊 Architecture Flow

```
User Browser
    ↓ HTTP Request
Frontend (Next.js) :3000
    ↓ API Call to /api/schedule
Next.js Orchestrator :3001
    ↓ Enriches with calendar data
    ↓ Forwards to Python
Python AI Service :8000
    ↓ 4 AI Agents Process
    ↓ Returns candidates
Next.js Orchestrator :3001
    ↓ Persists to DB (optional)
    ↓ Returns response
Frontend (Next.js) :3000
    ↓ Displays results
User Browser
```

## 🧪 Development Workflow

### 1. Make Changes

**Frontend**: Edit `frontend/` files → Hot reload automatic
**Orchestrator**: Edit `nextjs-orchestrator/` files → Hot reload automatic
**Python**: Edit `python-service/` files → Restart service

### 2. Test Changes

Run integration test after changes:
```powershell
.\test_integration.ps1
```

### 3. Commit

```powershell
git add .
git commit -m "Your changes"
git push
```

## 📁 Project Structure

```
ScaleDown_Proj/
├── frontend/                    # Next.js UI (port 3000)
├── nextjs-orchestrator/         # API layer (port 3001)
├── python-service/              # AI agents (port 8000)
├── start_all_services.ps1       # Startup script
├── test_integration.ps1         # Integration tests
├── test_integration_request.json # Test data
└── INTEGRATION_GUIDE.md         # Full documentation
```

## 🎯 Next Steps

1. **Run the services**: `.\start_all_services.ps1`
2. **Test integration**: `.\test_integration.ps1`
3. **Open browser**: http://localhost:3000
4. **Try scheduling**: Go to "Quick Schedule"
5. **Check results**: See AI-generated meeting times

## 📞 Need Help?

- See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed setup
- Check terminal logs for errors
- Run `python demo_agents.py` to test Python service standalone
- Use browser DevTools Network tab to debug API calls

---

**Status**: ✅ All components connected and ready to use!
