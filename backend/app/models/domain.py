from sqlmodel import SQLModel, Field, Column, JSON
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class DiscussionBase(SQLModel):
    question: str
    selected_models: List[str] = Field(sa_column=Column(JSON))
    discussion_depth: str = Field(default="Balanced")
    status: str = Field(default="Created") # Created, In Progress, Completed, Failed

class Discussion(DiscussionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModelResponseBase(SQLModel):
    discussion_id: uuid.UUID = Field(foreign_key="discussion.id")
    model_name: str
    cycle: int
    response: str
    updated_response: Optional[str] = None

class ModelResponse(ModelResponseBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConsensusBase(SQLModel):
    discussion_id: uuid.UUID = Field(foreign_key="discussion.id")
    agreements: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    disagreements: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    missing_information: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    open_questions: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    opinion_changes: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    confidence: Optional[int] = None
    reasoning_score: Optional[int] = None
    hallucination_risk: Optional[int] = None

class Consensus(ConsensusBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FinalReportBase(SQLModel):
    discussion_id: uuid.UUID = Field(foreign_key="discussion.id")
    report_json: dict = Field(sa_column=Column(JSON), default_factory=dict)
    workflow_type: str = Field(default="normal") # normal, continue, challenge
    report_version: int = Field(default=1)
    parent_report_id: Optional[uuid.UUID] = Field(default=None, foreign_key="finalreport.id")

class FinalReport(FinalReportBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

