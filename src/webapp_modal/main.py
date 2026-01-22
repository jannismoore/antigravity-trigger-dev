"""
FastAPI webhook server for Trigger.dev task triggering.
This is the Modal-compatible equivalent of the Hono webapp.
"""

import os
import asyncio
from typing import Optional

import httpx
from fastapi import FastAPI, Header, Query, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Antigravity Trigger.dev Webhook Server")

# Trigger.dev API endpoints
# Tasks API uses v1, Runs API uses v3
# See: https://trigger.dev/docs/management/runs/retrieve
TRIGGER_TASKS_API = "https://api.trigger.dev/api/v1"
TRIGGER_RUNS_API = "https://api.trigger.dev/api/v3"


@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {"message": "Antigravity Trigger.dev Webhook Server is running!"}


@app.post("/api/webhooks/{env}/{trigger_id}")
async def trigger_webhook(
    env: str,
    trigger_id: str,
    request: Request,
    mode: Optional[str] = Query(default="async"),
    agtr_secret: Optional[str] = Query(default=None),
    x_webhook_secret: Optional[str] = Header(default=None, alias="X-Webhook-Secret"),
):
    """
    Trigger a Trigger.dev task via webhook.
    
    Args:
        env: Environment to use ('production' or 'staging')
        trigger_id: The ID of the task to trigger
        mode: Execution mode ('async' or 'sync')
        agtr_secret: Webhook secret via query parameter
        x_webhook_secret: Webhook secret via header
    """
    # Validate environment parameter
    if env not in ["production", "staging"]:
        return JSONResponse(
            status_code=400,
            content={"error": 'Invalid environment. Must be either "production" or "staging"'}
        )

    # Get the appropriate API key based on environment
    api_key = (
        os.environ.get("TRIGGER_SECRET_KEY")
        if env == "production"
        else os.environ.get("TRIGGER_SECRET_KEY_STAGING")
    )

    if not api_key:
        key_name = "TRIGGER_SECRET_KEY" if env == "production" else "TRIGGER_SECRET_KEY_STAGING"
        return JSONResponse(
            status_code=500,
            content={"error": f"Missing API key for {env} environment. Please set {key_name}"}
        )

    # Validate webhook secret if WEBHOOK_SECRET is set
    expected_secret = os.environ.get("WEBHOOK_SECRET")
    if expected_secret:
        provided_secret = agtr_secret or x_webhook_secret
        if not provided_secret or provided_secret != expected_secret:
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized: Invalid or missing webhook secret"}
            )

    # Parse the request payload
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            payload = await request.json()
        else:
            text = await request.body()
            text = text.decode("utf-8")
            try:
                import json
                payload = json.loads(text)
            except Exception:
                payload = {"rawBody": text}
    except Exception as e:
        print(f"Failed to parse payload: {e}")
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid payload"}
        )

    # Trigger the task
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Trigger the task using Trigger.dev Tasks API (v1)
            trigger_response = await client.post(
                f"{TRIGGER_TASKS_API}/tasks/{trigger_id}/trigger",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"payload": payload},
            )

            if trigger_response.status_code not in [200, 201]:
                error_text = trigger_response.text
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "error": f"Trigger API error ({trigger_response.status_code}): {error_text}"}
                )

            handle = trigger_response.json()
            run_id = handle.get("id")

            # Async mode - return immediately (default)
            if mode != "sync":
                return JSONResponse(
                    content={
                        "success": True,
                        "triggerId": trigger_id,
                        "runId": run_id,
                        "publicAccessToken": handle.get("publicAccessToken"),
                    }
                )

            # Sync mode - poll for completion using Runs API (v3)
            # See: https://trigger.dev/docs/management/runs/retrieve
            terminal_statuses = ["COMPLETED", "CANCELED", "FAILED", "CRASHED", "SYSTEM_FAILURE"]
            max_attempts = 300  # 5 minutes max
            
            for attempt in range(max_attempts):
                run_response = await client.get(
                    f"{TRIGGER_RUNS_API}/runs/{run_id}",
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                
                if run_response.status_code == 404:
                    # Run might not be immediately available, wait and retry
                    await asyncio.sleep(1)
                    continue
                
                if run_response.status_code not in [200, 201]:
                    return JSONResponse(
                        status_code=500,
                        content={
                            "success": False, 
                            "error": f"Failed to retrieve run status: {run_response.status_code}"
                        }
                    )
                
                run = run_response.json()
                status = run.get("status")

                if status in terminal_statuses:
                    if status == "COMPLETED":
                        return JSONResponse(
                            content={
                                "success": True,
                                "triggerId": trigger_id,
                                "runId": run_id,
                                "output": run.get("output"),
                            }
                        )
                    else:
                        return JSONResponse(
                            status_code=500,
                            content={
                                "success": False,
                                "triggerId": trigger_id,
                                "runId": run_id,
                                "status": status,
                                "error": run.get("error"),
                            }
                        )

                # Wait before polling again
                await asyncio.sleep(1)

            # Timeout
            return JSONResponse(
                status_code=504,
                content={
                    "success": False,
                    "triggerId": trigger_id,
                    "runId": run_id,
                    "error": "Timeout waiting for task completion"
                }
            )

    except httpx.TimeoutException:
        return JSONResponse(
            status_code=504,
            content={"success": False, "error": "Timeout calling Trigger.dev API"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
