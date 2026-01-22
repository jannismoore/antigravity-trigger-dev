# Agentic Trigger.dev Framework

This project framework allows you to create deterministic, background workflows using **Trigger.dev v3**, with an added "Agentic Layer" that allows you to generate these workflows using natural language (powered by Google Gemini).

## Features
- **Deterministic Execution**: Uses Trigger.dev v3SDK for reliable, retriable, and durable task execution.
- **Agentic Builder**: A CLI tool that uses Google's Gemini 1.5 Flash to write valid Trigger.dev TypeScript code from your text prompts.
- **Developer First**: Fully customizable TypeScript code.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    - `GOOGLE_API_KEY`: Your Google Gemini API Key.
    - `TRIGGER_SECRET_KEY`: Your Trigger.dev Secret Key (production).
    - `TRIGGER_SECRET_KEY_STAGING`: Your Trigger.dev Secret Key (staging/development).

3.  **Trigger Project**:
    Ensure `trigger.config.ts` has your correct Project ID.

## Usage

### Running the Runtime
Start the dev server to run your defined tasks:
```bash
npm run dev
```

### Deploying to Production
To deploy your tasks to the Trigger.dev cloud platform:
```bash
npm run deploy
```
Follow the interactive prompts to authorize and select your project.

For more information, visit the [deployment documentation](https://trigger.dev/docs/deployment/overview).

### Webhook Server Deployment (Choose One)

The webhook server lets external services trigger your Trigger.dev tasks via HTTP. **Choose one deployment option:**

| Option | Command | Best For |
|--------|---------|----------|
| **Docker/Render** | `docker-compose up -d` | Traditional hosting, no cold starts |
| **Modal** | `modal deploy modal_app.py` | Serverless, pay-per-use |

**Option A: Docker/Render (Node.js)**
```bash
docker-compose up -d
# Server at http://localhost:3000
```

**Option B: Modal (Python/Serverless)**
```bash
pip install modal
modal token new
modal secret create trigger-secrets \
  TRIGGER_SECRET_KEY=your_prod_key \
  TRIGGER_SECRET_KEY_STAGING=your_staging_key
modal deploy modal_app.py
# Server at https://<username>--antigravity-webhook-fastapi-app.modal.run
```

📖 **Full guide:** [Webhook Integration](docs/WEBHOOK_INTEGRATION.md)

### Creating Workflows with AI
You can generate a new workflow by describing it:
```bash
npm run create-workflow "Create a task that runs every 5 minutes and checks an API endpoint"
```

Or use the integrated Agent Workflow if running within the Antigravity environment.

## Debugging

### Run Snapshots
To help agents debug failed runs, you can capture a snapshot of the latest run's inputs, outputs, and errors.

- **Development**:
  ```bash
  npm run snapshot:dev
  ```

- **Production**:
  ```bash
  npm run snapshot:prod
  ```

Snapshots are saved to `.agent/snapshots/latest.md`.

## Directory Structure
- `src/trigger/`: Where your workflow task files live.
- `src/agent/`: The code for the Agentic Builder.
- `src/webapp/`: The Hono web server for webhooks (Node.js/Docker).
- `src/webapp_modal/`: The FastAPI web server for webhooks (Python/Modal).

## Webhook API

Trigger tasks via HTTP using the webhook server (see [deployment options](#webhook-server-deployment-choose-one) above).

### Endpoint

```
POST /api/webhooks/{env}/{taskId}
```

- `env`: `production` or `staging`
- `taskId`: Your Trigger.dev task ID
- `mode=sync` (optional): Wait for task completion

### Examples

```bash
# Async (returns immediately)
curl -X POST "https://your-server/api/webhooks/production/answer-question" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'

# Sync (waits for completion)
curl -X POST "https://your-server/api/webhooks/production/answer-question?mode=sync" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'

# With authentication
curl -X POST "https://your-server/api/webhooks/production/answer-question?agtr_secret=your_secret" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

📖 **Full API reference:** [Webhook Integration](docs/WEBHOOK_INTEGRATION.md)