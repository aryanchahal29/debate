from sqlmodel import SQLModel
from app.db.session import engine
from app.models.domain import Discussion, ModelResponse, Consensus, FinalReport

def init_db():
    SQLModel.metadata.create_all(engine)
