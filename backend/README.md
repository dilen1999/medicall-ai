# MediCall AI — AI Voice Support Agent for Online Medicine Delivery

An AI-powered voice/automation backend that handles first-level customer
support for an online pharmacy after a delivery is completed — confirming
delivery, catching missing/wrong/damaged item complaints, routing
refund/replacement requests, and escalating anything medical to a licensed
pharmacist. Built to cut down on the manual phone-calling staff currently do
after every single delivery.

---

## 1. Business Problem

Online pharmacies that deliver medicine to customers' doors face a recurring
cost problem: after every delivery, someone on staff has to manually call
the customer to confirm the delivery went well, and to catch problems early
— missing items, wrong medicine, damaged packaging, refund requests, or
questions that need a pharmacist. This doesn't scale: it's expensive, slow,
and prone to human error in a domain (medicine) where mistakes have real
consequences.

## 2. Solution

MediCall AI automates that first call. After an order is marked
`DELIVERED`, the system triggers a voice confirmation call (or, in
simulation mode, accepts the transcript directly). The transcript is
analyzed by an LLM grounded in the pharmacy's own policy documents (via
RAG), classified into a structured result, and routed:

- Routine "all good" calls are logged and closed automatically.
- Logistics issues (missing item, damaged package) are flagged for the
  human support team.
- Anything involving wrong medicine or a medical question (dosage, side
  effects, symptoms, drug interactions) is escalated to a **pharmacist**,
  and the AI is hard-blocked from giving medical advice, no matter how the
  question is phrased.
- The owner gets a daily summary of call volume, issue breakdown, and
  urgent cases — by email or via an API endpoint.

## 3. Architecture

```
Order marked DELIVERED
        │
        ▼
 voice_service.start_outbound_call()  ──► Twilio (real) or logged intent (simulation)
        │
        ▼
 Customer responds (voice or, in simulation mode, typed text)
        │
        ▼
 transcription_service.transcribe_audio()   (skipped in simulation mode)
        │
        ▼
 rag_service.query_policies()  ──► ChromaDB vector store of pharmacy policies
        │
        ▼
 ai_analysis_service.analyze_transcript()
   ├─ LLM path (OpenAI) if OPENAI_API_KEY is set
   └─ rule-based fallback classifier if it isn't
        │
        ▼
 Safety-net override pass (medical keywords → forced pharmacist escalation,
 low confidence → forced human handoff)
        │
        ▼
 Persist CallLog + AICallAnalysis in PostgreSQL
        │
        ▼
 report_service ──► daily owner summary (API + email)
```

**Design principle:** the system is fully runnable and demoable with **zero
external API keys**. No OpenAI key → rule-based classifier + local
(no-key) embeddings for RAG. No Twilio credentials → simulation mode. No
SMTP → daily summary is logged instead of emailed. Every "real" integration
degrades gracefully instead of crashing.

## 4. Key Features

- **Simulation-first MVP**: `/api/calls/simulate/{order_id}` lets you test
  the entire AI pipeline with plain text, no phone call required.
- **Real Twilio structure included**: `voice_service.py` has a working
  outbound-call + TwiML + webhook structure ready to activate by adding
  credentials — no rewrite needed later.
- **RAG-grounded classification**: policy documents (refund, return,
  replacement, prescription, pharmacist-escalation rules) are chunked,
  embedded, and retrieved to ground the AI's reasoning.
- **Hard medical-safety boundary**: a deterministic safety-net check runs
  on every result (LLM or rule-based) and forces `pharmacist_required` and
  `handoff_required` to `true` whenever medical-escalation language is
  detected — this does not depend on the LLM behaving correctly.
- **Confidence-based handoff**: any classification with
  `confidence_score < 0.7` is automatically routed to a human, regardless
  of issue type.
- **Daily owner reporting**: aggregate call/issue counts, urgent case
  summaries, and email delivery (or graceful log-only fallback).
- **Clean layered architecture**: routes → services → models, so business
  logic is testable independently of FastAPI and easy to extend.

## 5. Tech Stack

| Layer            | Technology                                    |
|-------------------|------------------------------------------------|
| API framework      | FastAPI + Pydantic v2                          |
| ORM / DB           | SQLAlchemy 2.0 + PostgreSQL (Supabase-ready)   |
| AI / LLM           | OpenAI Chat Completions (JSON mode)            |
| RAG / vector store | ChromaDB (local no-key embeddings, or OpenAI)  |
| Voice              | Twilio (structure included, mockable)          |
| Automation         | n8n (schedule triggers, HTTP orchestration)     |
| Email              | SMTP (stdlib `smtplib`)                        |
| Containerization   | Docker + docker-compose                        |

## 6. Project Structure

```
medicall-ai/backend/
├── app/
│   ├── main.py                  FastAPI app + router wiring + startup
│   ├── config.py                Settings loaded from environment
│   ├── database.py              SQLAlchemy engine/session/Base
│   ├── dependencies.py          Shared FastAPI dependencies
│   ├── api/                     Route handlers (thin, delegate to services)
│   ├── models/                  SQLAlchemy ORM models
│   ├── schemas/                 Pydantic request/response schemas
│   ├── services/                Business logic (the real engine)
│   ├── prompts/                 LLM system prompt
│   ├── utils/                   Constants + response helpers
│   └── knowledge_base/          Policy .txt files indexed for RAG
├── n8n/                         n8n workflow JSON exports + setup guide
│   ├── medicall-ai-call-workflow.json
│   ├── medicall-ai-daily-summary-workflow.json
│   └── n8n-setup-guide.md
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 7. Setup

### Option A — Docker (recommended)

```bash
cd medicall-ai/backend
cp .env.example .env
docker compose up --build
```

The API will be available at `http://localhost:8000`. Swagger docs at
`http://localhost:8000/docs`.

### Option B — Local Python

```bash
cd medicall-ai/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Point DATABASE_URL at a local Postgres, or use SQLite for a quick spin:
#   DATABASE_URL=sqlite:///./medicall.db
uvicorn app.main:app --reload
```

On first run, `init_db()` auto-creates all tables — no manual migration step
needed to get started. (Swap to Alembic for real production schema changes.)

### Connecting to Supabase later

Just replace `DATABASE_URL` in `.env` with your Supabase Postgres
connection string:

```
DATABASE_URL=postgresql://postgres:<password>@<project-ref>.supabase.co:5432/postgres
```

No code changes required — SQLAlchemy doesn't care which Postgres it talks to.

## 8. Environment Variables

See `.env.example` for the full list. Nothing is required to run in
simulation mode — every integration (OpenAI, Twilio, SMTP) is optional and
degrades gracefully when unset.

## 9. Running the Simulation Flow

1. **Index the policy knowledge base** (one-time, or after editing policies):
   ```bash
   curl -X POST http://localhost:8000/api/rag/index
   ```
   > Note: the no-key local embedding model is downloaded once on first use
   > by ChromaDB. This requires normal internet access; if you're behind a
   > restrictive firewall/proxy, set `OPENAI_API_KEY` to use OpenAI
   > embeddings instead.

2. **Create a customer:**
   ```bash
   curl -X POST http://localhost:8000/api/customers \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Kumar Perera",
       "phone_number": "+94771234567",
       "email": "kumar@example.com",
       "language": "English",
       "country": "Sri Lanka"
     }'
   ```

3. **Create an order** (use the `id` returned above as `customer_id`):
   ```bash
   curl -X POST http://localhost:8000/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "order_reference": "MED-1001",
       "customer_id": "CUSTOMER_ID_HERE",
       "delivery_status": "PENDING",
       "total_amount": 4500.00,
       "prescription_required": true,
       "items": [
         {"medicine_name": "Vitamin D Tablets", "quantity": 2, "dosage_label": "As prescribed", "prescription_item": false}
       ]
     }'
   ```

4. **Mark it delivered** (use the order `id` returned above):
   ```bash
   curl -X PATCH http://localhost:8000/api/orders/ORDER_ID_HERE/status \
     -H "Content-Type: application/json" \
     -d '{"delivery_status": "DELIVERED"}'
   ```

5. **Simulate the confirmation call:**
   ```bash
   curl -X POST http://localhost:8000/api/calls/simulate/ORDER_ID_HERE \
     -H "Content-Type: application/json" \
     -d '{"transcript": "I received the package, but one Vitamin D strip is missing. The package was sealed. Please ask the pharmacy team to call me today."}'
   ```

   Expected response shape:
   ```json
   {
     "call": { "...": "call log fields" },
     "analysis": {
       "delivery_confirmed": true,
       "issue_type": "missing_item",
       "sentiment": "concerned",
       "priority": "high",
       "handoff_required": true,
       "pharmacist_required": false,
       "confidence_score": 0.85,
       "ai_summary": "Customer reports one or more items were missing from the delivered order."
     }
   }
   ```

6. **Check the owner's queue and daily summary:**
   ```bash
   curl http://localhost:8000/api/analysis/handoff-cases
   curl http://localhost:8000/api/reports/daily-summary
   ```

## 10. Sample API Requests (all endpoints)

| Method | Path                              | Purpose                                    |
|--------|------------------------------------|---------------------------------------------|
| POST   | `/api/customers`                  | Create customer                              |
| GET    | `/api/customers`                  | List customers                               |
| GET    | `/api/customers/{id}`             | Get customer                                 |
| POST   | `/api/orders`                     | Create order + items                         |
| GET    | `/api/orders`                     | List orders                                  |
| GET    | `/api/orders/pending-calls`       | **n8n:** DELIVERED orders awaiting a call     |
| GET    | `/api/orders/{id}`                | Get order                                    |
| PATCH  | `/api/orders/{id}/status`         | Update delivery status                       |
| POST   | `/api/orders/{id}/mark-call-triggered` | **n8n:** record Twilio call was placed  |
| POST   | `/api/orders/{id}/mark-call-failed`    | **n8n:** record Twilio call failed      |
| POST   | `/api/orders/{id}/mark-call-completed` | Record call completed, no handoff       |
| POST   | `/api/calls/start/{order_id}`     | Trigger outbound call (real or logged)       |
| POST   | `/api/calls/simulate/{order_id}`  | Simulate a call with a text transcript       |
| GET    | `/api/calls`                      | List call logs                               |
| GET    | `/api/calls/{id}`                 | Get call log                                 |
| POST   | `/api/calls/twiml/{order_id}`     | Twilio: greeting + `<Gather>` TwiML          |
| POST   | `/api/calls/gather-result/{order_id}` | Twilio: speech result → AI analysis      |
| POST   | `/api/calls/webhook`              | Twilio call-status callback                  |
| POST   | `/api/analyze-call/{call_log_id}` | Analyze an existing call's transcript        |
| GET    | `/api/analysis`                   | List all analyses                            |
| GET    | `/api/analysis/handoff-cases`     | **n8n:** cases needing human/pharmacist review |
| GET    | `/api/analysis/{id}`              | Get one analysis                             |
| POST   | `/api/notifications/handoff`      | **n8n:** send/log a handoff alert email      |
| POST   | `/api/rag/index`                  | (Re)index knowledge_base/*.txt               |
| POST   | `/api/rag/query`                  | Query the policy vector store directly       |
| GET    | `/api/reports/daily-summary`      | **n8n:** compute today's (or a date's) summary |
| POST   | `/api/reports/send-daily-summary` | Persist + email the daily summary            |

## 11. n8n Workflow Integration

### What n8n does in this project

n8n is the **automation/orchestration layer** — it decides *when* to act
(schedule triggers) and *what to call next* (HTTP requests), but it never
touches the database, never runs AI analysis, and never makes a
medical-safety decision. Concretely, n8n:

- Polls `GET /api/orders/pending-calls` every 5 minutes for orders that were
  just marked `DELIVERED`.
- Calls the Twilio REST API directly to place the outbound confirmation call.
- Reports the outcome back to FastAPI (`mark-call-triggered` /
  `mark-call-failed`).
- Polls `GET /api/analysis/handoff-cases` and emails the owner/pharmacist
  team when a case needs human attention.
- Runs a daily schedule that emails the owner a summary via
  `GET /api/reports/daily-summary`.

### Why FastAPI still handles backend and AI logic

All of the things that must be correct and safe stay in FastAPI, not n8n:

- **Database writes** — orders, call logs, and AI analyses are only ever
  written by FastAPI, inside a single transaction per request.
- **AI/RAG analysis** — `ai_analysis_service.py` (LLM or rule-based
  fallback) and the medical-safety override pass never run inside n8n.
- **Twilio conversation flow** — the TwiML `<Gather>` prompt and the speech
  result handler are FastAPI endpoints; n8n only *starts* the call, it
  doesn't talk to the customer.

This split means n8n workflows can be edited, re-imported, or swapped for
a different scheduler entirely without touching business logic or the
medical-safety rules.

### How n8n triggers the Twilio call

n8n's "Trigger Twilio Outbound Call" node calls the Twilio REST API
(`POST /2010-04-01/Accounts/{SID}/Calls.json`) directly, using each pending
order's `customer.phone_number` from `pending-calls`, and points Twilio's
`Url` parameter at `PUBLIC_BASE_URL/api/calls/twiml/{order_id}` and its
`StatusCallback` at `PUBLIC_BASE_URL/api/calls/webhook`.

### How Twilio sends speech to FastAPI

When the customer answers, Twilio requests `POST /api/calls/twiml/{order_id}`,
which returns a `<Gather input="speech">` TwiML prompt. Twilio transcribes
the customer's spoken reply and posts the result (`SpeechResult`, `CallSid`,
etc.) to `POST /api/calls/gather-result/{order_id}`.

### How FastAPI saves AI analysis

`gather-result` runs the transcript through `ai_analysis_service.analyze_transcript()`
(RAG-grounded LLM classification, or the deterministic rule-based fallback
if no `OPENAI_API_KEY` is set), applies the hard-coded medical-safety
override, and persists both the `CallLog` and `AICallAnalysis` rows. The
order's `call_status` is then set to `HANDOFF_REQUIRED` or `COMPLETED`.

### How n8n sends owner summary / handoff alerts

- **Handoff alerts**: the call workflow also polls
  `GET /api/analysis/handoff-cases?today_only=true` every 5 minutes (same
  schedule as the call trigger) and emails the owner/pharmacist team for
  each case found — this is what catches a `pharmacist_support` /
  `critical` case quickly rather than waiting for the daily summary.
- **Daily summary**: a separate workflow runs once a day at 6 PM, calls
  `GET /api/reports/daily-summary`, and emails the owner the aggregate
  counts.

### Architecture

```
Order Delivered
      ↓
n8n Schedule Trigger
      ↓
GET /api/orders/pending-calls
      ↓
Twilio Calls API
      ↓
Customer Voice Call
      ↓
FastAPI TwiML + Gather Webhook
      ↓
SpeechResult Transcript
      ↓
AI + RAG Analysis
      ↓
PostgreSQL
      ↓
n8n Owner Summary / Handoff Alert
```

### How to run n8n with Docker

```bash
docker compose up --build
```

n8n starts alongside `db` and `backend`, available at
`http://localhost:5678`, using `N8N_BASIC_AUTH_USER`/`N8N_BASIC_AUTH_PASSWORD`
from `.env`. Inside the Docker network, n8n reaches FastAPI at
`http://backend:8000` (`FASTAPI_BASE_URL`); Twilio reaches FastAPI at
whatever public tunnel URL you set as `PUBLIC_BASE_URL`; from your own
browser/Postman, FastAPI is still `http://localhost:8000`.

### How to import the workflow JSON

In the n8n UI: **Workflows → Import from File**, then pick
`backend/n8n/medicall-ai-call-workflow.json` and
`backend/n8n/medicall-ai-daily-summary-workflow.json`. Two nodes need a
credential attached by hand after import (workflow JSON never contains
real secrets): the Twilio HTTP Basic Auth credential and the SMTP email
credential. Full details in `backend/n8n/n8n-setup-guide.md`.

### How to configure environment variables

See `.env.example` — `FASTAPI_BASE_URL`, `PUBLIC_BASE_URL`,
`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER`,
`OWNER_EMAIL`, `SMTP_*`, and `N8N_BASIC_AUTH_USER`/`N8N_BASIC_AUTH_PASSWORD`
cover everything n8n needs. `TWILIO_ENABLED`/`AI_ENABLED` are optional
kill-switches (default `true`) to force simulation/rule-based mode even
when real credentials are present.

### How to test manually

See `backend/n8n/n8n-setup-guide.md` section 10 for the full manual test
walkthrough (create → deliver → execute workflow → answer call → check logs).
The short version: use each workflow's "Manual Trigger" node in the n8n UI
instead of waiting for the schedule.

## 12. Medical Safety Design

This is the most important design decision in the project. The AI must
never give medical advice — not as a nice-to-have, but as a hard
requirement. Two layers enforce this:

1. **Prompt-level instruction** (`app/prompts/voice_agent_prompt.py`) tells
   the LLM explicitly never to answer medical questions and to escalate
   instead.
2. **Deterministic safety-net override** (`_apply_safety_overrides` in
   `ai_analysis_service.py`) re-scans the raw transcript for
   medical-escalation keywords *after* the LLM (or rule-based fallback) has
   produced a result, and force-sets `pharmacist_required = true`,
   `handoff_required = true`, and `priority = "critical"` if any are found —
   regardless of what the LLM returned. This means a prompt-injection
   attempt or an LLM mistake cannot silently bypass the safety rule.

## 13. Future Improvements

- Replace `create_all()` with Alembic migrations for real schema versioning.
- Add authentication (JWT/OAuth) for the owner-facing endpoints.
- Add a React dashboard consuming this API (structure is already API-first).
- Add refill-reminder scheduling (proactive outbound calls, not just
  post-delivery).
- Add automated tests (pytest) around the rule-based classifier and API
  routes — the manual test flow above is a good starting point.
- Swap the fixed-size chunker in `rag_service.py` for a token-aware splitter
  as the knowledge base grows.

## 14. Interview Explanation (how to talk about this project)

**"What does it do?"**
It automates the first-level phone call a pharmacy's support staff makes
after every delivery — confirming the order arrived correctly and catching
issues (missing items, wrong medicine, damage, refund requests) — while
guaranteeing that anything medical gets routed to an actual pharmacist
instead of the AI answering it.

**"What's technically interesting about it?"**
Three things: (1) it's a deterministic-classifier-plus-LLM hybrid — the
system runs correctly whether or not you have an OpenAI key, because the
same business rules are implemented twice (as an LLM prompt and as a
rule-based fallback), which also makes the rule-based version a useful
regression check on the LLM's behavior; (2) RAG is used to ground
classification in actual policy documents rather than the model's general
knowledge; (3) there's a safety-net validation layer that re-checks every
LLM output against hard-coded medical-escalation rules, so correctness
doesn't depend entirely on prompt-following.

**"How would this scale to production?"**
Swap `create_all()` for Alembic migrations, correlate real Twilio call SIDs
to call logs for the live-call path, add auth on the owner-facing
endpoints, and move the vector store to a managed pgvector/Pinecone
instance if the policy corpus grows significantly. The service-layer
architecture means none of that touches the route or model layers.

## 15. CV Bullet Points

- Designed and built **MediCall AI**, an AI voice-automation backend (FastAPI,
  PostgreSQL, RAG) that classifies post-delivery pharmacy support calls into
  actionable categories (missing item, wrong medicine, damaged package,
  refund/replacement, pharmacist escalation) and routes urgent/medical
  cases to human review.
- Implemented a **hybrid LLM + deterministic rule-based classification
  pipeline** with a safety-net validation layer, ensuring the system never
  provides medical advice and remains fully functional and demoable without
  external API credentials.
- Built a **RAG pipeline** (ChromaDB, chunking, local + OpenAI embedding
  support) to ground AI classification decisions in the pharmacy's actual
  policy documents.
- Designed a **production-style layered architecture** (routes → services →
  ORM models) with Docker/Docker Compose support and a Supabase-ready
  PostgreSQL configuration.
