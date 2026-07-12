from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlmodel import Session
from app.db.session import get_session
from app.models.domain import Discussion, ModelResponse, Consensus, FinalReport
from pydantic import BaseModel
import uuid
from app.core.config import settings

router = APIRouter()

class StartDiscussionRequest(BaseModel):
    question: str
    models: list[str]
    api_keys: dict
    max_rounds: int = 2
    internal_engine: str = "auto"
    custom_api_bases: dict = {}
    custom_model_providers: dict = {}

@router.post("/")
def create_discussion(request: StartDiscussionRequest, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    discussion = Discussion(
        question=request.question,
        selected_models=request.models,
        max_rounds=request.max_rounds,
        internal_engine=request.internal_engine
    )
    session.add(discussion)
    session.commit()
    session.refresh(discussion)
    
    from app.worker import start_discussion_task
    if settings.USE_CELERY:
        start_discussion_task.delay(
            str(discussion.id), request.question, request.models, request.api_keys, request.max_rounds, request.internal_engine,
            request.custom_api_bases, request.custom_model_providers
        )
    else:
        # Development Mode: Run task directly in FastAPI background
        background_tasks.add_task(
            start_discussion_task, str(discussion.id), request.question, request.models, request.api_keys, request.max_rounds, request.internal_engine, request.custom_api_bases, request.custom_model_providers
        )
        
    return {"discussion_id": discussion.id, "status": "started"}

@router.get("/{discussion_id}")
def get_discussion_status(discussion_id: uuid.UUID, session: Session = Depends(get_session)):
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return {"id": discussion.id, "status": discussion.status}

@router.get("/{discussion_id}/report", response_model=FinalReport)
def get_discussion_report(discussion_id: uuid.UUID, session: Session = Depends(get_session)):
    from sqlmodel import select
    statement = select(FinalReport).where(FinalReport.discussion_id == discussion_id).order_by(FinalReport.generated_at.desc())
    report = session.exec(statement).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

class FollowUpRequest(BaseModel):
    api_keys: dict

@router.post("/{discussion_id}/continue")
def continue_discussion(discussion_id: uuid.UUID, req: FollowUpRequest, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    from app.worker import start_discussion_task
    if settings.USE_CELERY:
        start_discussion_task.delay(
            str(discussion_id), discussion.question, discussion.selected_models, req.api_keys, discussion.max_rounds, discussion.internal_engine,
            workflow_type="CONTINUE", parent_report_id=str(discussion_id), report_version=2
        )
    else:
        background_tasks.add_task(
            start_discussion_task, str(discussion_id), discussion.question, discussion.selected_models, req.api_keys, discussion.max_rounds, discussion.internal_engine, "CONTINUE", str(discussion_id), 2
        )
    return {"status": "processing", "workflow_type": "CONTINUE"}

@router.post("/{discussion_id}/challenge")
def challenge_answer(discussion_id: uuid.UUID, req: FollowUpRequest, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    from app.worker import start_discussion_task
    if settings.USE_CELERY:
        start_discussion_task.delay(
            str(discussion_id), discussion.question, discussion.selected_models, req.api_keys, discussion.max_rounds, discussion.internal_engine,
            workflow_type="CHALLENGE", parent_report_id=str(discussion_id), report_version=2
        )
    else:
        background_tasks.add_task(
            start_discussion_task, str(discussion_id), discussion.question, discussion.selected_models, req.api_keys, discussion.max_rounds, discussion.internal_engine, "CHALLENGE", str(discussion_id), 2
        )
    return {"status": "processing", "workflow_type": "CHALLENGE"}
