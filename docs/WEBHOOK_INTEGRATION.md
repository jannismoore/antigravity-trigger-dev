# Webhook Integration

This project includes a built-in web server to handle incoming webhooks and dispatch them to Trigger.dev tasks.

## Starting the Server

To start the webhook server locally:

```bash
npm run dev:web
```

In production, use:

```bash
npm run start:web
```

## Triggering a Task

You can trigger any task by sending a POST request to the generic webhook endpoint:

```
POST /api/webhooks/:triggerId
```

### Example

To trigger a task with ID `answer-question`:

```bash
curl -X POST http://localhost:3000/api/webhooks/answer-question \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the capital of France?"}'
```

The server will return the `runId` of the triggered task:

```json
{
  "success": true,
  "triggerId": "answer-question",
  "runId": "run_1234567890",
  "publicAccessToken": "..."
}
```

## Security

Currently, the webhook endpoint is open. In a production environment, you should verify that the server is running in a secure context or add authentication middleware to `src/webapp/index.ts`.
