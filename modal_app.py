"""
Modal deployment configuration for the Antigravity Trigger.dev Webhook Server.

Deploy with:
    modal deploy modal_app.py

For local development:
    modal serve modal_app.py
"""

import modal

# Define the Modal app
app = modal.App("antigravity-webhook")

# Create the container image with Python dependencies and local source code
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi>=0.109.0",
        "httpx>=0.26.0",
        "uvicorn>=0.27.0",
    )
    # Copy the webapp_modal source into the container
    .add_local_python_source("src")
)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("trigger-secrets")],
    # Keep container warm for 5 minutes after last request (reduces cold starts)
    scaledown_window=300,
)
@modal.concurrent(max_inputs=10)
@modal.asgi_app()
def fastapi_app():
    """
    Expose the FastAPI webhook server as a Modal web endpoint.
    
    The app will be available at:
    https://<your-username>--antigravity-webhook-fastapi-app.modal.run
    """
    from src.webapp_modal.main import app
    return app


# Optional: Add a scheduled health check
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("trigger-secrets")],
    schedule=modal.Cron("*/30 * * * *"),  # Every 30 minutes
)
def health_check():
    """
    Optional scheduled health check to keep the app warm.
    Remove or comment out if you don't need this.
    """
    import httpx
    
    # This will be the URL after deployment - update it once you deploy
    # url = "https://<your-username>--antigravity-webhook-fastapi-app.modal.run/"
    # response = httpx.get(url)
    # print(f"Health check: {response.status_code}")
    print("Health check placeholder - update with your deployed URL")
