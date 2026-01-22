# Webhook Integration

This project includes a webhook server to handle incoming HTTP requests and dispatch them to Trigger.dev tasks.

> **⚠️ Choose ONE deployment option.** You don't need both — pick the one that fits your needs.

## Deployment Options

| Option | Best For | Guide |
|--------|----------|-------|
| **Option A: Docker/Render** | Traditional hosting, consistent traffic, no cold starts | [See below](#option-a-dockerrender-nodejs) |
| **Option B: Modal** | Serverless, pay-per-use, sporadic traffic | [Modal Deployment Guide](MODAL_DEPLOYMENT.md) |

### Quick Comparison

| Feature | Docker/Render | Modal |
|---------|---------------|-------|
| **Language** | Node.js (Hono) | Python (FastAPI) |
| **Pricing** | ~$7/month fixed | Pay-per-use ($30 free/month) |
| **Cold Starts** | None (always-on) | ~1-2 seconds |
| **Scaling** | Manual | Automatic |
| **Setup** | Docker + hosting provider | `modal deploy` |

---

## Option A: Docker/Render (Node.js)

Use the built-in Hono web server for traditional hosting on Render, Railway, Fly.io, or any Docker host.

### Local Development

```bash
npm run dev:web
```

### Production Deployment

**With Docker:**
```bash
docker-compose up -d
```

**On Render/Railway:**
Deploy using the included `Dockerfile`. The server runs on port 3000.

### Files
- `src/webapp/index.ts` — Hono web server
- `Dockerfile` — Production container
- `docker-compose.yml` — Local Docker setup

---

## Option B: Modal (Python)

See the full guide: **[Modal Deployment Guide](MODAL_DEPLOYMENT.md)**

Quick start:
```bash
pip install modal
modal token new
modal secret create trigger-secrets TRIGGER_SECRET_KEY=xxx TRIGGER_SECRET_KEY_STAGING=xxx
modal deploy modal_app.py
```

### Files
- `src/webapp_modal/main.py` — FastAPI web server
- `modal_app.py` — Modal deployment config

---

## API Reference (Same for Both Options)

Both deployment options expose the **same API endpoints**.

### Health Check

```
GET /
```

### Trigger a Task

```
POST /api/webhooks/{env}/{taskId}
```

**Parameters:**
- `env`: `production` or `staging`
- `taskId`: Your Trigger.dev task identifier
- `mode` (query): `async` (default) or `sync`
- `agtr_secret` (query) or `X-Webhook-Secret` (header): Optional authentication

### Examples

**Async mode (returns immediately):**
```bash
curl -X POST "https://your-server/api/webhooks/production/my-task" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

Response:
```json
{
  "success": true,
  "triggerId": "my-task",
  "runId": "run_xxx"
}
```

**Sync mode (waits for completion):**
```bash
curl -X POST "https://your-server/api/webhooks/production/my-task?mode=sync" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

Response:
```json
{
  "success": true,
  "triggerId": "my-task",
  "runId": "run_xxx",
  "output": { "result": "..." }
}
```

**With authentication:**
```bash
curl -X POST "https://your-server/api/webhooks/production/my-task?agtr_secret=your_secret" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## Security

Set the `WEBHOOK_SECRET` environment variable to require authentication on all requests.

- **Docker/Render:** Add to `.env` file
- **Modal:** Add to `trigger-secrets` when creating secrets

If `WEBHOOK_SECRET` is not set, all requests are accepted (useful for development).
