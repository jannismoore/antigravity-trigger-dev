# Modal Deployment Guide

> **This is Option B for webhook deployment.** See [Webhook Integration](WEBHOOK_INTEGRATION.md) to compare with Docker/Render (Option A).

Deploy the webhook server on [Modal.com](https://modal.com) for serverless, pay-per-use hosting.

## Why Modal?

| Feature | Modal | Docker/Render |
|---------|-------|---------------|
| **Pricing** | Pay-per-use (~$0.0001/sec) | Fixed monthly (~$7/mo) |
| **Free Tier** | $30/month credits | Limited |
| **Scaling** | Automatic | Manual |
| **Cold Starts** | ~1-2 seconds | None (always-on) |
| **Best For** | Sporadic webhook traffic | Consistent traffic |

## Prerequisites

1. A [Modal.com](https://modal.com) account
2. Python 3.11+ installed locally
3. Your Trigger.dev API keys

## Setup

### 1. Install Modal CLI

```bash
pip install modal
```

### 2. Authenticate with Modal

```bash
modal token new
```

This opens a browser to authenticate with your Modal account.

### 3. Create Modal Secrets

Store your Trigger.dev credentials as Modal secrets:

```bash
modal secret create trigger-secrets \
  TRIGGER_SECRET_KEY=tr_prod_xxxx \
  TRIGGER_SECRET_KEY_STAGING=tr_dev_xxxx \
  WEBHOOK_SECRET=your_optional_secret
```

> **Note:** `WEBHOOK_SECRET` is optional. If not set, webhook authentication is disabled.

To update secrets later:

```bash
modal secret create trigger-secrets --force \
  TRIGGER_SECRET_KEY=tr_prod_xxxx \
  TRIGGER_SECRET_KEY_STAGING=tr_dev_xxxx \
  WEBHOOK_SECRET=new_secret
```

## Deployment

### Local Development

Test your Modal app locally with hot-reloading:

```bash
modal serve modal_app.py
```

This gives you a temporary URL for testing.

### Deploy to Production

```bash
modal deploy modal_app.py
```

You'll receive a permanent URL like:
```
https://<your-username>--antigravity-webhook-fastapi-app.modal.run
```

## Usage

The API is identical to the Docker deployment. Just replace `localhost:3000` with your Modal URL.

### Health Check

```bash
curl https://<your-modal-url>/
```

### Trigger a Task (Production)

```bash
curl -X POST "https://<your-modal-url>/api/webhooks/production/answer-question" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

### Trigger a Task (Staging)

```bash
curl -X POST "https://<your-modal-url>/api/webhooks/staging/answer-question" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

### With Webhook Secret

```bash
# Via query parameter
curl -X POST "https://<your-modal-url>/api/webhooks/production/answer-question?agtr_secret=your_secret" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'

# Via header
curl -X POST "https://<your-modal-url>/api/webhooks/production/answer-question" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{"question": "What is AI?"}'
```

### Synchronous Mode

Wait for task completion:

```bash
curl -X POST "https://<your-modal-url>/api/webhooks/production/answer-question?mode=sync" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

## Managing Your Deployment

### View Logs

```bash
modal app logs antigravity-webhook
```

### Stop the App

```bash
modal app stop antigravity-webhook
```

### List All Apps

```bash
modal app list
```

### View App Details

Visit the [Modal Dashboard](https://modal.com/apps) to see:
- Request metrics
- Logs
- Resource usage
- Costs

## Configuration Options

Edit `modal_app.py` to customize:

```python
@app.function(
    # Secrets to inject as environment variables
    secrets=[modal.Secret.from_name("trigger-secrets")],
    
    # Keep container warm for 5 minutes (reduces cold starts)
    scaledown_window=300,
    
    # Optional: Add memory/CPU limits
    # memory=512,  # MB
    # cpu=1.0,     # vCPUs
)
@modal.concurrent(max_inputs=10)  # Allow up to 10 concurrent requests per container
```

## Troubleshooting

### "Secret not found" Error

Make sure you created the secrets:

```bash
modal secret list
```

If `trigger-secrets` is not listed, create it:

```bash
modal secret create trigger-secrets TRIGGER_SECRET_KEY=your_key
```

### Cold Start Too Slow

Increase `container_idle_timeout` in `modal_app.py` to keep containers warm longer. Or enable the optional health check cron job to ping your endpoint periodically.

### CORS Issues

If calling from a browser, you may need to add CORS middleware. Edit `src/webapp_modal/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your domains
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Cost Estimation

Modal charges based on compute time:
- ~$0.000024/second for CPU
- First $30/month is free

For a webhook server with:
- 1000 requests/day
- 200ms average response time

**Estimated cost:** ~$0.15/month (well within free tier)
