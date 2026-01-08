---
description: Trigger a workflow via the generic webhook endpoint
---
To trigger a Trigger.dev workflow from an external source (like a webhook from another service), use the built-in Generic Webhook Server.

### Prerequisites

1.  **Web Server Running**: Ensure the web server is running.
    *   Locally: `npm run dev:web`
    *   Production: `npm run start:web`
2.  **Task ID**: Know the `id` of the task you want to trigger (e.g., `answer-question`).

### Step-by-Step

1.  **Construct the URL**:
    *   The endpoint format is: `POST /api/webhooks/:triggerId`
    *   Example: `http://localhost:3000/api/webhooks/my-task-id`

2.  **Send the Request**:
    *   Use `curl` or any HTTP client.
    *   Set `Content-Type: application/json`.
    *   Include the task payload in the body.

      -d '{"key": "value"}'
    ```

    **Sync Mode (Wait for Result)**:
    To wait for the task to finish and receive the output in the response, use `?mode=sync`.

    ```bash
    curl -X POST "http://localhost:3000/api/webhooks/my-task-id?mode=sync" \
      -H "Content-Type: application/json" \
      -d '{"key": "value"}'
    ```

3.  **Verify**:
    *   The response will contain the `runId` of the triggered task.
    *   Check the Trigger.dev dashboard to see the run status.

### Security Note
In production, ensure your webhook server is protected or validates incoming requests if necessary. The current implementation is an open endpoint.
