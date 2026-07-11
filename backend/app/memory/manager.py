from sqlmodel import Session, select
from app.models.domain import Consensus, ModelResponse

class MemoryEngine:
    def __init__(self, session: Session):
        self.session = session

    def get_shared_memory(self, discussion_id):
        """
        Retrieves the latest consensus which acts as the shared memory for all models.
        """
        statement = select(Consensus).where(Consensus.discussion_id == discussion_id).order_by(Consensus.created_at.desc())
        return self.session.exec(statement).first()

    def get_model_memory(self, discussion_id, model_name):
        """
        Retrieves the private memory (previous responses) for a specific model.
        """
        statement = select(ModelResponse).where(
            ModelResponse.discussion_id == discussion_id,
            ModelResponse.model_name == model_name
        ).order_by(ModelResponse.cycle.asc())
        return self.session.exec(statement).all()
