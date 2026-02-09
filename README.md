# 🤖 AI Meeting Scheduler Agent

**An intelligent meeting scheduling system with conflict resolution, Google Calendar integration, and AI-powered optimization.**

[![Stage](https://img.shields.io/badge/Stage-6%20Complete-success)](https://github.com/Vansh1535/Meeting-Scheduler-Agent)
[![Lines of Code](https://img.shields.io/badge/Code-~4.2K%20lines-blue)](https://github.com/Vansh1535/Meeting-Scheduler-Agent)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Overview

A production-ready AI meeting scheduler that:
- 📅 **Reads** real Google Calendar data (compresses 12 months by 80-90%)
- 🤖 **Thinks** with 4 specialized AI agents (Availability, Preference, Optimization, Negotiation)
- 🛡️ **Enforces** real-world constraints (buffer time, travel time, risk scoring)
- 📝 **Acts** by autonomously creating calendar events with invites and Google Meet links

**Result**: Reduces scheduling overhead by **75%**, coordinates **20+ person meetings**, and prevents bad meetings before they happen.

---

## ✨ Key Features

### Core Capabilities
- ✅ **Smart Scheduling**: AI scores candidates 0-100 based on availability, preferences, and optimization
- ✅ **Google Calendar Integration**: Full OAuth 2.0 with read/write access
- ✅ **Calendar Compression**: ScaleDown AI reduces 12 months to statistical summaries (80-90% reduction)
- ✅ **Enforcement Layer**: Dynamic buffer time, travel validation, cancellation risk scoring
- ✅ **Auto-Creation**: Writes approved meetings to Google Calendar with attendees and Meet links
- ✅ **Recurring Optimization**: Detects low-scoring recurring meetings and suggests better slots
- ✅ **Time-Savings Tracking**: Measures conflicts avoided and iterations prevented

### Technical Highlights
- **4 AI Agents**: Specialized agents for availability, preference learning, optimization, and negotiation
- **Multi-Party Coordination**: No participant limit, scales to any group size
- **Idempotent Operations**: Safe retry logic, no duplicate events
- **Explainable AI**: Every decision is logged and traceable
- **Database Persistence**: Full audit trail in Supabase PostgreSQL

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│ Complete Scheduling Pipeline (6 Stages)                │
└────────────────────────────────────────────────────────┘

1. READ (Stage 4)
   📅 Google Calendar API → ScaleDown Compression → Supabase

2. THINK (Stages 1-3)  
   🤖 4 AI Agents → Score Candidates → Realistic Weighted Scoring

3. ENFORCE (Stage 6)
   🛡️ Buffer Time + Travel Time + Risk Scoring → Filter Bad Meetings

4. ACT (Stage 5)
   📝 Create Calendar Events → Send Invites → Add Meet Links
```

### Technology Stack

**Backend**:
- Python 3.13 + FastAPI (AI Brain with 4 agents)
- Next.js 15 + TypeScript (API orchestration)
- Supabase PostgreSQL (data persistence)

**Integrations**:
- Google Calendar API (OAuth 2.0)
- Google Meet (automatic conference links)
- ScaleDown AI (calendar compression)

**Deployment**:
- Python: Railway / Render
- Next.js: Vercel
- Database: Supabase Cloud

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- Google Cloud Project with Calendar API enabled
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/Vansh1535/Meeting-Scheduler-Agent.git
cd Meeting-Scheduler-Agent

# Install Python dependencies
cd python-service
pip install -r requirements.txt

# Install Node.js dependencies
cd ../nextjs-orchestrator
npm install

# Set up environment variables (see INTEGRATION_GUIDE.md)
cp .env.example .env.local
```

### Configuration

1. **Google Calendar Setup**:
   - Create OAuth 2.0 credentials in Google Cloud Console
   - Add to `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

2. **Supabase Setup**:
   - Create new project at supabase.com
   - Run migrations in `supabase/migrations/`
   - Add to `.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Python Service**:
   - Configure in `python-service/.env`
   - Set `PORT=8000`

See [`docs/INTEGRATION_GUIDE.md`](docs/INTEGRATION_GUIDE.md) for detailed setup instructions.

### Running Services

```bash
# Terminal 1: Start Python AI Brain
cd python-service
python main.py
# Runs on http://localhost:8000

# Terminal 2: Start Next.js Orchestrator
cd nextjs-orchestrator
npm run dev
# Runs on http://localhost:3000
```

### Run Tests

```bash
# Quick test (Stage 6 enforcement)
.\test\test_stage6_quick.ps1

# Full test suite
.\test\test_stage6_enforcement.ps1

# Stage-specific tests
.\test\test_stage4.ps1  # Google Calendar sync
.\test\test_stage5_writeback.ps1  # Calendar write-back
```

See [`test/README.md`](test/README.md) for full testing documentation.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`docs/INTEGRATION_GUIDE.md`](docs/INTEGRATION_GUIDE.md) | Complete setup and configuration guide |
| [`docs/AI_SCORING_SYSTEM.md`](docs/AI_SCORING_SYSTEM.md) | How the 4 AI agents score meetings |
| [`docs/HYBRID_COMPRESSION.md`](docs/HYBRID_COMPRESSION.md) | ScaleDown compression architecture |
| [`docs/STAGE4_README.md`](docs/STAGE4_README.md) | Google Calendar integration details |
| [`docs/STAGE5_README.md`](docs/STAGE5_README.md) | Calendar write-back implementation |
| [`docs/STAGE6_README.md`](docs/STAGE6_README.md) | Enforcement layer documentation |
| [`docs/TERMINAL_COMMANDS.md`](docs/TERMINAL_COMMANDS.md) | Useful commands reference |

---

## 🎯 API Usage

### Schedule a Meeting

```bash
POST http://localhost:3000/api/schedule
Content-Type: application/json

{
  "meeting_id": "team-sync-001",
  "participant_emails": [
    "alice@example.com",
    "bob@example.com"
  ],
  "constraints": {
    "duration_minutes": 30,
    "earliest_date": "2026-02-12T00:00:00Z",
    "latest_date": "2026-02-16T23:59:59Z",
    "working_hours_start": 9,
    "working_hours_end": 17,
    "buffer_minutes": 15,
    "timezone": "America/New_York",
    "max_candidates": 10,
    "allowed_days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}
```

**Response**: Ranked candidate slots with AI scores and enforcement metadata.

### Write to Google Calendar

```bash
POST http://localhost:3000/api/calendar/write-back
Content-Type: application/json

{
  "meeting_id": "team-sync-001",
  "user_id": "your-user-id"
}
```

**Response**: Created event with Google Calendar link and Meet conference details.

See API documentation for all endpoints.

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| **Stages Complete** | 6/6 (100%) |
| **Lines of Code** | ~4,200 |
| **AI Agents** | 4 (Availability, Preference, Optimization, Negotiation) |
| **Database Tables** | 12 |
| **API Endpoints** | 8 |
| **Compression Ratio** | 80-90% (12 months → statistical summary) |
| **Time Savings** | 75% reduction in scheduling overhead |

---

## 🗂️ Project Structure

```
Meeting-Scheduler-Agent/
├── python-service/          # FastAPI AI Brain (4 agents)
│   ├── agents/              # AI agents (availability, preference, etc.)
│   ├── schemas/             # Pydantic models
│   ├── services/            # ScaleDown compression service
│   └── main.py              # FastAPI application
│
├── nextjs-orchestrator/     # Next.js API orchestration
│   ├── src/
│   │   ├── app/api/         # API routes
│   │   ├── lib/             # Utility libraries
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── supabase/                # Database schema
│   └── migrations/          # SQL migrations (001-004)
│
├── test/                    # Test scripts
│   ├── test_stage4.ps1      # Calendar sync tests
│   ├── test_stage5_writeback.ps1
│   ├── test_stage6_enforcement.ps1
│   └── README.md            # Testing documentation
│
├── docs/                    # Project documentation
│   ├── INTEGRATION_GUIDE.md
│   ├── AI_SCORING_SYSTEM.md
│   ├── STAGE4_README.md
│   ├── STAGE5_README.md
│   └── STAGE6_README.md
│
└── README.md                # This file
```

---

## 🛡️ Enforcement Features (Stage 6)

The system actively prevents bad meetings:

| Feature | Description |
|---------|-------------|
| **Buffer Time** | Dynamic 10-25 min buffer based on calendar density |
| **Travel Time** | Validates location transitions, blocks impossible travel |
| **Risk Scoring** | Low/Medium/High cancellation risk with explainable factors |
| **Time Savings** | Tracks conflicts avoided × 15 min/iteration |
| **Recurring Optimization** | Detects low-scoring recurring slots, suggests better times |

All enforcement decisions are logged to database for full traceability.

---

## 🔬 Testing

Comprehensive test suite covering all stages:

```bash
# Run all tests
cd test
.\test_stage6_enforcement.ps1  # Full Stage 6 test suite
.\test_stage6_quick.ps1         # Quick validation

# Stage-specific tests
.\test_stage4.ps1               # Google Calendar sync
.\test_stage5_writeback.ps1     # Calendar write-back
```

**Test Coverage**:
- ✅ OAuth authentication flow
- ✅ Calendar compression (80-90% reduction verified)
- ✅ AI scoring with 4 agents
- ✅ Enforcement rules (buffer, travel, risk)
- ✅ Calendar event creation
- ✅ Idempotency and retry logic

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Calendar API** for calendar integration
- **ScaleDown AI** for intelligent calendar compression
- **Supabase** for database infrastructure
- **FastAPI** and **Next.js** for robust frameworks

---

## 📞 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/Vansh1535/Meeting-Scheduler-Agent/issues)
- 📖 Docs: [Documentation](docs/)

---

**Built with ❤️ by [Vansh1535](https://github.com/Vansh1535)**

**⭐ Star this repo if you find it helpful!**
