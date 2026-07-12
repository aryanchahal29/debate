from celery import Celery
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

celery_app = Celery(
    "ai_council_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

from app.debate.engine import DebateEngine
from app.debate.state import DiscussionState
from app.memory.manager import MemoryEngine
from app.db.session import engine
from sqlmodel import Session

@celery_app.task
def start_discussion_task(discussion_id: str, question: str, models: list, api_keys: dict, max_rounds: int, internal_engine: str, custom_api_bases: dict = {}, custom_model_providers: dict = {}, workflow_type: str = "NORMAL", parent_report_id: str = None, report_version: int = 1):
    """
    Background task to run the AI Council debate process via LangGraph.
    Supports NORMAL, CONTINUE, and CHALLENGE modes.
    """
    logger.info(f"Starting discussion {discussion_id} with workflow {workflow_type}")
    
    with Session(engine) as db_session:
        memory_engine = MemoryEngine(db_session)
        debate_engine = DebateEngine(memory_engine)
        
        graph = debate_engine.build_graph()
        
        initial_state: DiscussionState = {
            "discussion_id": discussion_id,
            "workflow_type": workflow_type,
            "parent_report_id": parent_report_id,
            "report_version": report_version,
            "question": question,
            "selected_models": models,
            "max_rounds": max_rounds,
            "internal_engine": internal_engine,
            "api_keys": api_keys,
            "custom_api_bases": custom_api_bases,
            "custom_model_providers": custom_model_providers,
            "cycles": [],
            "status": "Initializing",
            "consensus_score": None,
            "hallucination_score": None,
            "reasoning_score": None,
            "missing_information": [],
            "continue_discussion": False,
            "provider_failures": {},
            "execution_time": 0.0,
            "tokens_used": 0,
            "cost": 0.0
        }
        
        final_state = graph.invoke(initial_state)
        
        logger.info(f"Discussion {discussion_id} completed with status: {final_state['status']}")
        return {"status": final_state["status"], "discussion_id": discussion_id}
