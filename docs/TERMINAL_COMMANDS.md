# Terminal Commands Reference

This document contains all necessary terminal commands to setup, run, and test the Meeting Scheduler system.

---

## 🔧 Initial Setup

### 1. Create Python Virtual Environment
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1
```

### 2. Install Python Dependencies
```powershell
# Navigate to python-service directory
cd python-service

# Install required packages
pip install fastapi uvicorn pydantic python-dateutil
```

### 3. Install Next.js Dependencies
```powershell
# Navigate to nextjs-orchestrator directory
cd nextjs-orchestrator

# Install Node packages
npm install
```

---

## 🚀 Running Services

### Start Python AI Service (Port 8000)

**Option 1: Foreground (with logs)**
```powershell
cd python-service
python main.py
```

**Option 2: Background Job**
```powershell
Start-Job -ScriptBlock { 
    Set-Location 'C:\Users\lilan\Desktop\ScaleDown_Proj\python-service'
    & 'C:\Users\lilan\Desktop\ScaleDown_Proj\.venv\Scripts\python.exe' 'main.py' 
}

# Check status
Get-Job

# View logs
Get-Job -Id <job-id> | Receive-Job

# Stop background job
Stop-Job -Id <job-id>
Remove-Job -Id <job-id>
```

### Start Next.js Orchestrator (Port 3000)

**Option 1: Foreground (with logs)**
```powershell
cd nextjs-orchestrator
npm run dev
```

**Option 2: Background Job**
```powershell
Start-Job -ScriptBlock { 
    Set-Location 'C:\Users\lilan\Desktop\ScaleDown_Proj\nextjs-orchestrator'
    npm run dev 
}

# Check status and logs (same commands as Python service)
Get-Job
Get-Job -Id <job-id> | Receive-Job
```

---

## 🧪 Testing Endpoints

### Python Service Direct Tests

**Health Check**
```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/health' -Method Get
```

**Root Info**
```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/' -Method Get
```

**List All Agents**
```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/agents' -Method Get
```

**Schedule Meeting (Direct to Python)**
```powershell
$body = Get-Content 'python-service\test_request.json' -Raw
Invoke-RestMethod -Uri 'http://localhost:8000/schedule' -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```

### Next.js Orchestrator Tests

**Health Check (Full System)**
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule' -Method Get | ConvertTo-Json -Depth 5
```

**Schedule Meeting (Through Orchestrator)**
```powershell
$body = Get-Content 'python-service\test_request.json' -Raw
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule' -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```

### Using curl (Alternative to PowerShell)

**Health Checks**
```bash
# Python service
curl http://localhost:8000/health

# Next.js orchestrator
curl http://localhost:3000/api/schedule
```

**Schedule Meeting**
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d @python-service/test_request.json
```

---

## 🔍 Development & Debugging

### Check Running Processes
```powershell
# List all Python processes
Get-Process | Where-Object {$_.ProcessName -like '*python*'}

# List all Node processes
Get-Process | Where-Object {$_.ProcessName -like '*node*'}

# Check if ports are in use
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

### Kill Processes by Port
```powershell
# Kill process on port 8000
$processId = (Get-NetTCPConnection -LocalPort 8000).OwningProcess
Stop-Process -Id $processId -Force

# Kill process on port 3000
$processId = (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id $processId -Force
```

### Background Job Management
```powershell
# List all jobs
Get-Job

# Get detailed job info
Get-Job -Id <job-id> | Format-List

# Receive output from job
Get-Job -Id <job-id> | Receive-Job

# Stop and remove job
Stop-Job -Id <job-id>
Remove-Job -Id <job-id>

# Stop and remove all jobs
Get-Job | Stop-Job
Get-Job | Remove-Job
```

### View Live Logs
```powershell
# Python service logs (if running in background)
Get-Job -Id <python-job-id> | Receive-Job -Keep

# Keep tailing new output
while ($true) { 
    Get-Job -Id <job-id> | Receive-Job
    Start-Sleep -Seconds 2 
}
```

---

## 🧩 Testing Individual Python Agents

### Run Verification Script
```powershell
cd python-service
python verify_agents.py
```

### Run Direct Test Script
```powershell
cd python-service
python test_direct.py
```

### Run PowerShell Test Script
```powershell
cd python-service
.\test_scheduler.ps1
```

---

## 📦 Git Commands

### Stage and Commit Changes
```powershell
# Check status
git status

# Stage specific files
git add nextjs-orchestrator/
git add python-service/main.py

# Stage all changes
git add .

# Commit with message
git commit -m "feat: Add Next.js orchestrator for Python AI service"

# Push to remote
git push origin main
```

### View Changes
```powershell
# View unstaged changes
git diff

# View staged changes
git diff --staged

# View commit history
git log --oneline -10
```

---

## 🛠️ Environment Configuration

### Python Service (.env or environment variables)
```powershell
# Set environment variables (if needed)
$env:PORT = "8000"
$env:HOST = "0.0.0.0"
```

### Next.js Orchestrator (.env.local)
```powershell
# View environment config
Get-Content nextjs-orchestrator\.env.local

# Edit environment variables
notepad nextjs-orchestrator\.env.local
```

**Required variables:**
- `PYTHON_SERVICE_URL=http://localhost:8000`
- `REQUEST_TIMEOUT_MS=30000`

---

## 🏗️ Production Build Commands

### Python Service Production
```powershell
# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Next.js Production Build
```powershell
cd nextjs-orchestrator

# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 Quick Start (Both Services)

### Start Everything at Once
```powershell
# Start Python service in background
Start-Job -Name "PythonAI" -ScriptBlock { 
    Set-Location 'C:\Users\lilan\Desktop\ScaleDown_Proj\python-service'
    & 'C:\Users\lilan\Desktop\ScaleDown_Proj\.venv\Scripts\python.exe' 'main.py' 
}

# Start Next.js in background
Start-Job -Name "NextJS" -ScriptBlock { 
    Set-Location 'C:\Users\lilan\Desktop\ScaleDown_Proj\nextjs-orchestrator'
    npm run dev 
}

# Wait for services to start
Start-Sleep -Seconds 8

# Test health
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule' -Method Get | ConvertTo-Json -Depth 5

# View all job statuses
Get-Job
```

### Stop Everything
```powershell
# Stop all jobs
Get-Job | Stop-Job
Get-Job | Remove-Job

# Verify everything stopped
Get-Job
```

---

## 🎯 Common Workflows

### Full Development Cycle
```powershell
# 1. Activate Python environment
.\.venv\Scripts\Activate.ps1

# 2. Start Python service
cd python-service
python main.py
# (In separate terminal)

# 3. Start Next.js service
cd nextjs-orchestrator
npm run dev
# (In separate terminal)

# 4. Test integration
cd python-service
$body = Get-Content 'test_request.json' -Raw
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule' -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10

# 5. Stop services (Ctrl+C in each terminal)
```

### Quick Test After Code Changes
```powershell
# Restart Python service (auto-reload enabled)
# Just save your Python files, uvicorn will reload automatically

# Restart Next.js (auto-reload enabled for most changes)
# Save your TypeScript files, Next.js will hot-reload

# For configuration changes, restart manually:
# Ctrl+C in each terminal, then restart services
```

---

## 📝 Notes

- **Python Service**: Runs with auto-reload in development mode (uvicorn watches for file changes)
- **Next.js Service**: Hot Module Replacement (HMR) enabled by default in dev mode
- **Ports**: Python (8000), Next.js (3000) - ensure these are available
- **Virtual Environment**: Always activate `.venv` before running Python commands
- **Job Management**: Background jobs don't auto-restart on crashes - use process managers for production
- **Logs**: Background jobs buffer output - use `Receive-Job` to view logs

---

## 🔗 Useful Links

- **Python Service**: http://localhost:8000
- **Python API Docs**: http://localhost:8000/docs (Swagger UI)
- **Python Health**: http://localhost:8000/health
- **Next.js Orchestrator**: http://localhost:3000
- **Next.js API**: http://localhost:3000/api/schedule
- **GitHub Repository**: https://github.com/Vansh1535/Meeting-Scheduler-Agent
