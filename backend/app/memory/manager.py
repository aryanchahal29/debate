from sqlmodel import Session, select
from app.models.domain import Discussion, ModelResponse, Consensus, FinalReport
import uuid

class MemoryEngine:
    def __init__(self, session: Session):
        self.session = session

    def save_discussion(self, discussion: Discussion):
        self.session.add(discussion)
        self.session.commit()
        self.session.refresh(discussion)
        return discussion

    def get_discussion(self, discussion_id: uuid.UUID):
        return self.session.get(Discussion, discussion_id)

    def save_model_response(self, response: ModelResponse):
        self.session.add(response)
        self.session.commit()
        
    def get_model_memory(self, discussion_id: uuid.UUID, model_name: str):
        statement = select(ModelResponse).where(
            ModelResponse.discussion_id == discussion_id,
            ModelResponse.model_name == model_name
        ).order_by(ModelResponse.cycle.asc())
        return self.session.exec(statement).all()

    def save_consensus(self, consensus: Consensus):
        self.session.add(consensus)
        self.session.commit()

    def get_consensus_memory(self, discussion_id: uuid.UUID):
        statement = select(Consensus).where(Consensus.discussion_id == discussion_id).order_by(Consensus.created_at.desc())
        return self.session.exec(statement).first()

    def save_final_report(self, report: FinalReport):
        self.session.add(report)
        self.session.commit()

    def get_final_report(self, discussion_id: uuid.UUID):
        statement = select(FinalReport).where(FinalReport.discussion_id == discussion_id).order_by(FinalReport.generated_at.desc())
        return self.session.exec(statement).first()
