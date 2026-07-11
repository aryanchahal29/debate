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
def start_discussion_task(discussion_id: str, question: str, models: list, api_keys: dict, depth: str):
    """
    Background task to run the AI Council debate process via LangGraph.
    """
    logger.info(f"Starting discussion {discussion_id} with models {models}")
    
    with Session(engine) as db_session:
        memory_engine = MemoryEngine(db_session)
        debate_engine = DebateEngine(memory_engine)
        
        graph = debate_engine.build_graph()
        
        max_cycles = 2 if depth == "Fast" else 3 if depth == "Balanced" else 5
        
        initial_state: DiscussionState = {
            "discussion_id": discussion_id,
            "question": question,
            "selected_models": models,
            "api_keys": api_keys,
            "cycles": [],
            "discussion_depth": depth,
            "max_cycles": max_cycles,
            "consensus_score": None,
            "hallucination_score": None,
            "reasoning_score": None,
            "missing_information": [],
            "continue_discussion": False,
            "provider_failures": {},
            "execution_time": 0.0,
            "tokens_used": 0,
            "cost": 0.0,
            "status": "In Progress"
        }
        
        final_state = graph.invoke(initial_state)
        
        logger.info(f"Discussion {discussion_id} completed with status: {final_state['status']}")
        return {"status": final_state["status"], "discussion_id": discussion_id}
