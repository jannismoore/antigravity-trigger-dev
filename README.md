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
    - `TRIGGER_SECRET_KEY`: Your Trigger.dev Secret Key (for local dev).

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

### Creating Workflows with AI
You can generate a new workflow by describing it:
```bash
npm run create-workflow "Create a task that runs every 5 minutes and checks an API endpoint"
```
Or use the integrated Agent Workflow if running within the Antigravity environment.

## Directory Structure
- `src/trigger/`: Where your workflow task files live.
- `src/agent/`: The code for the Agentic Builder.
- `src/webapp/`: The Hono web server for webhooks.

## Webhook Server

This framework includes a built-in Hono web server to trigger tasks via HTTP.

### Starting the Server
- Development: `npm run dev:web`
- Production: `npm run start:web`

### Triggering Tasks
Send a POST request to `/api/webhooks/<TRIGGER_ID>` with a JSON payload. The payload is passed directly to the task.

**Example:**
```bash
curl -X POST http://localhost:3000/api/webhooks/answer-question \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```