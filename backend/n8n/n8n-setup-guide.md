# n8n Setup Guide — MediCall AI

This guide gets the n8n automation layer running against your FastAPI
backend and importing the two workflows in this folder.

n8n is the **automation/orchestration layer** only. It never talks to
PostgreSQL, never runs AI analysis, and never decides medical-safety rules —
all of that stays in FastAPI. n8n's job is: poll for work, call Twilio,
tell FastAPI what happened, and email the owner.

## 1. Start services

From `backend/`:

```bash
docker compose up --build
```

This starts three containers: `medicall_postgres`, `medicall_backend`
(FastAPI on `:8000`), and `medicall_n8n` (n8n on `:5678`).

## 2. Open n8n

```
http://localhost:5678
```

## 3. Log in

Use the credentials from your `.env`:

- Username: `N8N_BASIC_AUTH_USER` (default `admin`)
- Password: `N8N_BASIC_AUTH_PASSWORD` (default `admin123`)

**Change these from the defaults before exposing n8n beyond localhost.**

## 4. Import the workflows

In the n8n UI: **Workflows → Import from File**, and import:

- `backend/n8n/medicall-ai-call-workflow.json` — "MediCall AI - Trigger
  Medicine Delivery Calls" (polls every 5 minutes, places Twilio calls,
  and also checks for handoff cases needing an owner alert)
- `backend/n8n/medicall-ai-daily-summary-workflow.json` — "MediCall AI -
  Daily Owner Summary" (runs once daily at 6 PM)

## 5. Configure environment variables

The n8n container already receives these from `docker-compose.yml` /
your `.env` (no extra setup needed inside n8n itself):

| Variable | Used for |
|---|---|
| `FASTAPI_BASE_URL` | n8n → FastAPI, inside Docker this is `http://backend:8000` |
| `PUBLIC_BASE_URL` | Twilio → FastAPI, the externally reachable tunnel URL |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | placing outbound calls |
| `OWNER_EMAIL` | destination for summary/alert emails |

`FASTAPI_BASE_URL` and `PUBLIC_BASE_URL` are **not the same thing**:

- `FASTAPI_BASE_URL=http://backend:8000` is how **n8n** (inside Docker)
  reaches FastAPI — container-to-container, on the compose network.
- `PUBLIC_BASE_URL=https://your-tunnel.example.com` is how **Twilio**
  (a real phone network service on the public internet) reaches FastAPI's
  TwiML/webhook endpoints. It must be a publicly reachable URL, not
  `localhost` and not `backend`.
- From your own browser/Postman, FastAPI is `http://localhost:8000`.

## 6. Two credentials you must configure by hand inside n8n

Workflow JSON files never contain real secrets, so two nodes need a
credential attached after import:

1. **"Trigger Twilio Outbound Call"** node (call workflow) — create an
   **HTTP Basic Auth** credential:
   - Username: your `TWILIO_ACCOUNT_SID`
   - Password: your `TWILIO_AUTH_TOKEN`
   - Attach it to the node's "Authentication" credential field.

2. **"Send Owner Summary Email"** and **"Send Handoff Alert Email"** nodes —
   create an **SMTP** credential matching `SMTP_HOST` / `SMTP_PORT` /
   `SMTP_USER` / `SMTP_PASSWORD` from your `.env`, and attach it to both
   Email Send nodes.

   If you don't have SMTP set up yet, FastAPI's own `/notifications/handoff`
   and `/reports/send-daily-summary` endpoints already log the message
   instead of failing — you can safely skip email in n8n for now and just
   watch the FastAPI logs.

## 7. Expose FastAPI to the public internet (for real Twilio calls)

Twilio needs to reach your TwiML (`/api/calls/twiml/{order_id}`) and
webhook (`/api/calls/webhook`, `/api/calls/gather-result/{order_id}`)
endpoints. Locally, start a tunnel to port 8000:

```bash
cloudflared tunnel --url http://localhost:8000
```

or

```bash
ngrok http 8000
```

## 8. Copy the public URL into .env

```
PUBLIC_BASE_URL=https://your-public-url
```

## 9. Restart backend and n8n

```bash
docker compose restart backend n8n
```

(Both need the new `PUBLIC_BASE_URL` — n8n uses it to build the `Url`/
`StatusCallback` fields it sends to Twilio; FastAPI doesn't strictly need
it for these endpoints, but keep it in sync anyway.)

## 10. Test the workflow manually

1. Create a customer, an order, and mark it `DELIVERED` (see the main
   README's cURL examples).
2. In n8n, open "MediCall AI - Trigger Medicine Delivery Calls" and click
   **Execute Workflow** (uses the "Manual Trigger" node instead of waiting
   up to 5 minutes).
3. Watch each node's output in the n8n UI: pending order found → Twilio
   call placed → `mark-call-triggered` called.
4. Answer the call, speak a response, confirm FastAPI logs the transcript
   and analysis (`docker compose logs -f backend`).
5. Manually execute "MediCall AI - Daily Owner Summary" the same way to
   test the email path without waiting for 6 PM.

## 11. Check Twilio call logs

```
Twilio Console → Monitor → Logs → Calls
```

This shows call status, duration, and any error codes Twilio returned —
useful when a call shows as FAILED in MediCall AI but you're not sure why.

## 12. Troubleshooting

**Busy**
- The customer's phone may be busy or rejecting the call.
- Trial Twilio accounts can only call verified numbers — verify the number
  in the Twilio Console, or upgrade the account.
- Try a different verified number to confirm it's not project-side.

**Failed**
- Double-check `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` in `.env` and in
  the n8n HTTP Basic Auth credential — they must match.
- Check Twilio's Geo Permissions for the destination country.
- Trial accounts require the destination number to be verified first.

**No webhook received / call connects but nothing happens in FastAPI**
- Confirm `PUBLIC_BASE_URL` is set to the current tunnel URL (ngrok/
  Cloudflare URLs change every restart unless you're on a paid/fixed plan).
- Confirm the tunnel is still running (`cloudflared`/`ngrok` process alive).
- Check `docker compose logs -f backend` for incoming requests to
  `/api/calls/twiml/{order_id}` and `/api/calls/gather-result/{order_id}`.
- Confirm the endpoint path Twilio was given matches exactly (no typos in
  the `Url`/`StatusCallback` fields in the "Trigger Twilio Outbound Call"
  node).

**No pending orders returned by GET /api/orders/pending-calls**
- Confirm the order's `delivery_status` is exactly `DELIVERED`
  (`PATCH /api/orders/{order_id}/status`).
- Confirm the order's `call_status` is `PENDING` (this is the default for
  new orders; it only changes once a call has been triggered for it).
- An order already `TRIGGERED`/`FAILED`/`COMPLETED`/`HANDOFF_REQUIRED`
  will not show up again — that's by design, so the same order is never
  dialed twice by the 5-minute polling loop.

## 13. Future notification channels

The "Send Handoff Alert Email" and "Send Owner Summary Email" nodes are
plain n8n Email Send nodes. To add Slack or WhatsApp alongside (or instead
of) email:

- **Slack**: add an `n8n-nodes-base.slack` node in parallel, fed from the
  same "Has Handoff Cases?" / "Has Summary?" IF branch, using the same
  `{{$json...}}` fields.
- **WhatsApp**: use n8n's Twilio node (or a raw HTTP Request node against
  the Twilio WhatsApp API) the same way — same credential as the outbound
  call node.

No FastAPI changes are needed for either — both endpoints already return
everything needed (`order_reference`, `customer_name`, `phone_number`,
`issue_type`, `priority`, `pharmacist_required`, `summary`) in one call.
