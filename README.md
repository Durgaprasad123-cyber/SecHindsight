# SecHindsight

> **A Cybersecurity SOC Copilot That Learns From Every Incident.**

---

## Tagline

A Cybersecurity SOC Copilot That Learns From Every Incident.

---

## Overview

In modern Security Operations Centers (SOC), analysts continuously investigate high volumes of security alerts and incidents. A major challenge in security operations is that organizational experience remains fragmented: when an analyst resolves a complex alert—whether verifying an unusual login as a benign false positive or identifying a subtle privilege escalation pattern—that knowledge often lives only in closed ticket notes or analyst memory. As a result, SOC teams waste significant time re-investigating identical alert profiles.

**SecHindsight** solves this problem by using **Hindsight** as a persistent organizational memory layer for SOC investigation workflows. By capturing structured outcomes, evidence summaries, analyst decisions, and lessons learned from past investigations, SecHindsight empowers AI agents and human analysts to continuously build upon past organizational experience.

*Note: SecHindsight is designed as a reasoning, investigation, and memory copilot for SOC analysts. It is not an endpoint security sensor and does not claim to detect or block every cyber attack out of the box.*

---

## Core Idea

SecHindsight embeds persistent memory directly into the incident investigation and response lifecycle:

```
Incident
   │
   ▼
Investigate ───────────► Multi-Agent Pipeline (Triage & Context Collection)
   │
   ▼
Recall ────────────────► Query Hindsight Organizational Memory for Prior Experience
   │
   ▼
Reflect / Reason ──────► Synthesize Historical Lessons & Identify Delta Indicators
   │
   ▼
Recommendation ────────► Formulate Defensive Containment Strategy
   │
   ▼
Human Approval ────────► SOC Analyst Approves or Rejects Proposed Actions
   │
   ▼
Defensive Simulation ──► Execute Safe Containment Simulation
   │
   ▼
Retain Outcome ────────► Store Immutable Evidence, Decision, & Lesson Learned in Hindsight
   │
   ▼
Future Investigation ──► Retained Knowledge Informs Subsequent Incidents
```

---

## How Hindsight Is Used

SecHindsight relies on **Hindsight** as the persistent memory layer for security operations. Hindsight performs three core operations:

### Retain
Stores completed incident experiences once an investigation is finalized. Retained attributes include:
- Evidence summary & raw indicators
- Analyst decision (e.g., `BENIGN_CONFIRMED`, `CONFIRMED_COMPROMISE`)
- Response taken (e.g., `ISOLATE_ENDPOINT`, `REQUIRE_MFA_REAUTH`)
- Final outcome & impact
- Structured lesson learned
- Relevant metadata and tags

### Recall
Retrieves relevant prior organizational experiences when a new incident arrives. Uses semantic and indicator matching to pull historical cases with similar alert signatures, user accounts, or host behaviors.

### Reflect
Synthesizes retrieved organizational experiences alongside current alert context to reason about the active investigation. Hindsight Reflection compares historical false-positive ratios against confirmed compromises and highlights critical "delta indicators" (e.g., presence of privilege escalation) that analysts should examine.

> **Key Distinction:** Hindsight operates strictly as the **Memory Layer** (storing, indexing, recalling, and reflecting on historical organizational knowledge), while **AI Reasoning Providers (Groq & Google Gemini)** perform dynamic reasoning over the supplied context, evidence extraction, threat mapping, and recommendation generation.

---

## Architecture

SecHindsight is built on a modern, decoupled architecture connecting frontend interfaces, backend orchestration, AI inference providers, and persistent memory services.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Next.js 16 Frontend UI                         │
│   (Dashboard, Incident Queue, Investigation View, Hindsight Explorer)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST API
┌────────────────────────────────────▼────────────────────────────────────┐
│                           FastAPI Backend Service                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Multi-Agent Orchestrator                       │  │
│  │  [Triage Agent] → [Investigation Agent] → [Threat Agent] → [Response]│  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│       ┌────────────────────────────┼────────────────────────────┐       │
│       │                            │                            │       │
│ ┌─────▼───────┐             ┌──────▼────────┐           ┌───────▼─────┐ │
│ │ AI Service  │             │   Hindsight   │           │    MITRE    │ │
│ │ Router      │             │ Memory Cloud  │           │  ATT&CK DB  │ │
│ │ ├─ Groq     │             └───────────────┘           └─────────────┘ │
│ │ └─ Gemini   │                    │                            │       │
│ └─────────────┘ ┌──────────────────▼────────────────────────────▼─────┐ │
│                 │              Defensive Simulator & Human-in-the-Loop  │ │
│                 └──────────────────┬──────────────────────────────────┘ │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Supabase PostgreSQL / SQLite DB                      │
│        (Incidents, Evidence, Agent Runs, Audit Logs, Local Mirror)      │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Frontend:** Next.js (React / TypeScript) for real-time SOC monitoring, investigation visualizer, and memory management.
- **Backend:** FastAPI (Python) providing REST APIs, agent orchestration, and simulation services.
- **AI Reasoning Providers:** Unified AI Service router supporting **Groq** and **Google Gemini** (via official `google-genai` SDK).
- **Memory Layer:** Hindsight Cloud API (`sechindsight` bank) for Retain, Recall, and Reflect operations.
- **Database:** Supabase PostgreSQL (with asynchronous local SQLite engine fallback).
- **Threat Knowledge:** MITRE ATT&CK framework mapping for TTP classification.
- **Defensive Response:** Safe Response Simulator engine coupled with mandatory human analyst approval.


---

## Agent Architecture

SecHindsight employs a multi-agent orchestration pipeline (`orchestrator.py`) where specialized agents handle specific phases of the investigation lifecycle:

1. **Triage Agent (`triage_agent.py`):**
   - Evaluates incoming raw alert descriptions and metadata.
   - Assigns threat categories (e.g., `credential_compromise`, `privilege_escalation`, `brute_force`, `phishing`).
   - Calculates initial severity levels (`low`, `medium`, `high`, `critical`) and confidence scores.

2. **Investigation Agent (`investigation_agent.py`):**
   - Integrates directly with Hindsight Memory Services.
   - Executes `recall_memories` to retrieve matching historical organizational incidents.
   - Runs `reflect_on_memories` to evaluate false-positive risks and compare current evidence with past lessons.
   - Generates comprehensive investigation findings.

3. **Threat Analysis Agent (`threat_agent.py`):**
   - Maps evidence and investigation findings to standardized MITRE ATT&CK Tactics, Techniques, and Procedures (TTPs).
   - Identifies threat actor patterns and technique IDs (e.g., `T1078` Valid Accounts, `T1068` Exploitation for Privilege Escalation).

4. **Response Agent (`response_agent.py`):**
   - Formulates targeted containment strategies based on incident severity and investigation context.
   - Recommends specific response actions (e.g., `ISOLATE_ENDPOINT`, `REQUIRE_MFA_REAUTH`, `DISABLE_ACCOUNT`).
   - Places proposed actions into `PENDING_APPROVAL` status awaiting human authorization.

---

## Hindsight Memory Example

SecHindsight demonstrates memory-driven investigation through a 3-part progression (available in the demo seed data):

### INC-1001 — Known Corporate Laptop
- **Context:** User `jdoe` authenticated via internal VPN from IP `192.168.1.105` on a registered corporate device (`WORKSTATION-012`).
- **Analyst Decision:** `BENIGN_CONFIRMED`
- **Retained Lesson:** *"Unusual login time alone from a verified internal corporate device frequently produces false positives."*

### INC-1002 — Unknown Device
- **Context:** User `jdoe` authenticated via VPN from an unrecognized device hardware identifier (`UNK-DEV-9921`). No privilege elevation requested.
- **Analyst Decision:** `SESSION_VERIFIED` (after MFA push re-authentication).
- **Retained Lesson:** *"Unrecognized device hardware ID without privilege escalation requires step-up authentication, but does not indicate compromise."*

### INC-1003 — Unknown Device + Privilege Escalation
- **Context:** User `jdoe` logged in from unrecognized device `UNK-DEV-9921` and immediately executed a privilege escalation script (`sudo su - root` / token impersonation attempt).
- **Analyst Decision:** `CONFIRMED_COMPROMISE`
- **Retained Lesson:** *"Unrecognized device combined with immediate privilege escalation strongly correlates with true compromise."*

> **Memory Isolation:** Each incident experience retains its own distinct evidence summary, outcome, decision, and lesson learned within the Hindsight memory bank while maintaining strict incident identity boundaries.

---

## Demo Workflow

The built-in Master Demo workflow demonstrates how SecHindsight operates step-by-step:

1. **Open Incident:** View an active incident in the queue (e.g., `INC-1003`).
2. **Investigate:** Click **Run Autonomous Investigation** to launch the multi-agent orchestration.
3. **Hindsight Recall:** The Investigation Agent queries Hindsight Cloud Bank `sechindsight` for prior incident memories.
4. **Historical Comparison:** Recalls `INC-1001` and `INC-1002` to compare device fingerprints and user behaviors.
5. **Reflect / Reasoning:** Hindsight Reflection notes that while `INC-1002` (unknown device alone) was benign after MFA, `INC-1003` includes privilege escalation—marking it as a high-confidence compromise.
6. **Recommendation:** The Response Agent recommends immediate host isolation (`ISOLATE_ENDPOINT`).
7. **Human Approval:** The SOC analyst reviews the agent findings and approves the isolation action.
8. **Simulated Defensive Response:** The Response Simulator executes the simulated host isolation and logs the execution output.
9. **Retain:** The analyst decision, evidence summary, outcome, and lesson learned are retained into Hindsight Cloud Bank `sechindsight`.
10. **View Newly Retained Memory:** Navigate to the Memory Explorer to verify that the newly retained incident outcome is indexable for future investigations.

---

## Features

- **Incident Queue & Triage:** Centralized queue with automated categorization, severity scoring, and confidence ratings.
- **Multi-Agent SOC Investigation:** Orchestrated pipeline across Triage, Investigation, Threat Analysis, and Response agents.
- **Hindsight Organizational Memory:** Retain, Recall, and Reflect operations integrated into every investigation.
- **Semantic & Keyword Memory Recall:** Fast retrieval of past security incidents matching current indicators.
- **Reflection & Risk Synthesis:** Automated false-positive risk assessment based on historical organizational outcomes.
- **MITRE ATT&CK Mapping:** Automatic correlation of investigation findings with standardized threat techniques.
- **Human-in-the-Loop Control:** Mandatory human analyst approval required for all defensive actions.
- **Defensive Response Simulation:** Safe execution engine simulating endpoint isolation, credential revocation, IP blocking, and file quarantine.
- **Immutable Audit Trail:** Complete audit logging of all system actions, agent executions, decisions, and memory retention events.
- **Analytics & Metrics Dashboard:** Visual charts tracking incident severities, status distributions, latency, and false-positive reduction.
- **Memory Explorer UI:** Interactive interface for searching, filtering, and managing retained organizational memories.

---

## Technology Stack

| Layer | Technology / Component | Version / Specification |
| --- | --- | --- |
| **Frontend Framework** | Next.js (App Router, Turbopack) | v16.3.6 |
| **UI Library** | React / TypeScript | React v19.2.8 / TS ^5.0 |
| **Styling & Icons** | Tailwind CSS / Lucide React / Framer Motion | Tailwind v4, Lucide v1.48, Framer Motion v13 |
| **Data Visualization** | Recharts / Canvas Confetti | Recharts v3.10.1 |
| **Backend Framework** | FastAPI / Python | FastAPI >=0.110.0 / Python 3.10+ |
| **ASGI Server** | Uvicorn | v0.28.0+ |
| **Database ORM** | SQLAlchemy / AsyncPG / Aiosqlite | SQLAlchemy >=2.0.28 (Async Engine) |
| **Database Systems** | Supabase PostgreSQL / SQLite | PostgreSQL (Production) / SQLite (Local fallback) |
| **LLM Inference** | Groq API | Models: `openai/gpt-oss-120b`, `llama-3.3-70b-versatile` |
| **Organizational Memory** | Hindsight Cloud API | Bank: `sechindsight` (`https://api.hindsight.vectorize.io`) |
| **Threat Intelligence** | MITRE ATT&CK Framework | Custom service mapping TTPs |
| **Containerization** | Docker & Docker Compose | Multi-stage Dockerfiles |

---

## Project Structure

```
SecHindsight/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── investigation_agent.py
│   │   │   ├── orchestrator.py
│   │   │   ├── response_agent.py
│   │   │   ├── threat_agent.py
│   │   │   └── triage_agent.py
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── analytics.py
│   │   │       ├── health.py
│   │   │       ├── incidents.py
│   │   │       ├── memories.py
│   │   │       ├── responses.py
│   │   │       ├── seed.py
│   │   │       └── threats.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── models.py
│   │   │   └── session.py
│   │   ├── services/
│   │   │   ├── groq_service.py
│   │   │   ├── hindsight_service.py
│   │   │   ├── mitre_service.py
│   │   │   └── simulator_service.py
│   │   └── main.py
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── analytics/
│   │   │   ├── audit-log/
│   │   │   ├── demo/
│   │   │   ├── incidents/
│   │   │   ├── memory/
│   │   │   ├── responses/
│   │   │   ├── threats/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   └── lib/
│   ├── Dockerfile
│   └── package.json
├── AWS_DEPLOYMENT.md
├── docker-compose.yml
└── README.md
```

---

## Local Development

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (copy example file)
cp .env.example .env

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

Backend API will be accessible at:
- **API Base:** `http://localhost:8000/api/v1`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Endpoint:** `http://localhost:8000/api/v1/health`

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Next.js development server
npm run dev
```

Frontend application will be accessible at `http://localhost:3000`.

### 3. Docker Compose Setup (Full Stack)

```bash
# From repository root
docker-compose up -d --build
```

---

## Environment Variables

Configure environment variables in `backend/.env` (refer to `backend/.env.example`).

### Backend Environment Variables
- `GROQ_API_KEY`: API key for Groq LLM service (backend-only).
- `GROQ_MODEL`: Model identifier for Groq (e.g., `openai/gpt-oss-120b`).
- `GEMINI_API_KEY`: API key for Google Gemini AI service (backend-only).
- `GEMINI_MODEL`: Model identifier for Gemini (default: `gemini-2.5-flash`).
- `AI_PROVIDER`: Selected AI reasoning provider (`groq` or `gemini`, default: `groq`).
- `HINDSIGHT_API_KEY`: API key for Hindsight Cloud API (backend-only).
- `HINDSIGHT_BASE_URL`: Base URL for Hindsight Cloud API (`https://api.hindsight.vectorize.io`).
- `HINDSIGHT_BANK_ID`: Target memory bank identifier (default: `sechindsight`).
- `SUPABASE_URL`: Supabase project URL (backend-only).
- `SUPABASE_SECRET_KEY`: Supabase secret service role key (backend-only).
- `SUPABASE_PUBLISHABLE_KEY`: Supabase publishable/anon key.
- `DATABASE_URL`: Database connection string (`sqlite+aiosqlite:///./sec_hindsight.db` or PostgreSQL URI).
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g., `http://localhost:3000`).
- `ENVIRONMENT`: Runtime environment (`development` or `production`).
- `LOG_LEVEL`: Application log level (`INFO`, `DEBUG`).

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000/api/v1`).

> **Security Reminder:** Never commit real secrets, API keys, or database credentials to version control. All AI provider keys remain strictly server-side.

---

## API Endpoints

SecHindsight provides REST API endpoints under `/api/v1`:

### AI Provider Status
- `GET /api/v1/ai/provider`: Returns active AI reasoning provider (`groq` or `gemini`), model, configuration status, and supported providers.

### Incidents
- `GET /api/v1/incidents`: List incidents with optional filters (`status`, `severity`, `category`).
- `POST /api/v1/incidents`: Create a new security incident.
- `GET /api/v1/incidents/{incident_id}`: Retrieve detailed incident info, evidence, agent runs, analyst decisions, and responses.
- `POST /api/v1/incidents/{incident_id}/investigate`: Trigger the multi-agent investigation lifecycle.
- `POST /api/v1/incidents/{incident_id}/approve`: Submit analyst approval to execute simulated defensive response actions.
- `POST /api/v1/incidents/{incident_id}/reject`: Submit analyst rejection for proposed response actions.

### Hindsight Memory

- `GET /api/v1/memories`: Query or list retained memories (supports semantic/keyword search via `?query=`).
- `POST /api/v1/memories/retain`: Retain incident outcomes, decisions, and lessons learned into Hindsight.

### Responses & Audit Logs
- `GET /api/v1/responses`: List simulated response actions and execution statuses.
- `GET /api/v1/responses/audit-logs`: Retrieve system-wide immutable audit trail events.

### Threat Intelligence & Analytics
- `GET /api/v1/threats`: List MITRE ATT&CK technique mappings.
- `GET /api/v1/threats/{technique_id}`: Retrieve details for a specific MITRE technique.
- `GET /api/v1/analytics`: Fetch operational metrics, severity breakdowns, status distributions, and memory influence stats.

### Health & Demo Seeding
- `GET /api/v1/health`: System health check verifying Groq, Hindsight Cloud, and Database connectivity.
- `POST /api/v1/seed`: Reset and seed the database with Master Demo incidents and isolated memories.

---

## Demo Data

All seeded incidents (`INC-1001` through `INC-1004` and `INC-2001` through `INC-2004`) are **synthetic demonstration data** created specifically for testing and evaluating SecHindsight's multi-agent investigation and memory retention workflows. They do not contain real operational telemetry or enterprise threat data.

---

## Screenshots / Demo Video

### Interface Screenshots

- **Command Center Dashboard:**  
  `docs/screenshots/command-center.png`
- **Multi-Agent Investigation View:**  
  `docs/screenshots/investigation.png`
- **Hindsight Memory Explorer:**  
  `docs/screenshots/hindsight.png`

### Demo Video

- **Walkthrough Video:** `https://youtube.com/watch?v=placeholder` *(Recording URL Placeholder)*

---

## Security Notes

- **Server-Side Secret Isolation:** All API credentials (`GROQ_API_KEY`, `HINDSIGHT_API_KEY`, `SUPABASE_SECRET_KEY`) remain strictly backend-side and are never exposed to client browsers.
- **Simulated Containment:** Response actions (`ISOLATE_ENDPOINT`, `QUARANTINE_FILE`, `BLOCK_IP`, `DISABLE_ACCOUNT`) are safely simulated by `simulator_service.py` to prevent accidental operational disruption.
- **Human-in-the-Loop Authorization:** Automated agents generate recommendations only; execution of containment actions requires explicit human analyst approval.
- **Memory Boundary Isolation:** Incident memories are scoped and retained with incident-specific metadata to prevent cross-contamination of evidence details.

---

## Hindsight Highlight

The core differentiator of **SecHindsight** is the operational memory cycle:

$$\text{Retain} \longrightarrow \text{Recall} \longrightarrow \text{Reflect}$$

1. **Retain:** Every resolved incident outcome becomes a permanent asset in organizational memory.
2. **Recall:** New security alerts immediately benefit from relevant prior incident experiences.
3. **Reflect:** AI agents reason across historical false positives and confirmed compromises, preventing SOC teams from repeating past mistakes or missing subtle repeating threat patterns.

---

## Current Status

**Status: Functional Prototype / Operational Demonstration System**

SecHindsight's multi-agent orchestrator, Hindsight Cloud memory integration, MITRE ATT&CK mapping, response simulator, and analyst approval workflows have been verified and tested across local and containerized deployment environments.
