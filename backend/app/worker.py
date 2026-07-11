from celery import Celery
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

celery_app = Celery(
    "ai_council_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

@celery_app.task
def start_discussion_task(discussion_id: str, models: list, api_keys: dict):
    """
    Background task to run the AI Council debate process.
    """
    logger.info(f"Starting discussion {discussion_id} with models {models}")
    # In a real implementation, this would instantiate the DebateEngine and run the flow.
    return {"status": "completed", "discussion_id": discussion_id}
