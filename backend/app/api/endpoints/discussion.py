from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.domain import Discussion, DiscussionBase
import uuid

router = APIRouter()

@router.post("/", response_model=Discussion)
def create_discussion(discussion_in: DiscussionBase, session: Session = Depends(get_session)):
    db_discussion = Discussion.model_validate(discussion_in)
    session.add(db_discussion)
    session.commit()
    session.refresh(db_discussion)
    
    # TODO: Trigger Celery background task for debate engine
    
    return db_discussion

@router.get("/{discussion_id}", response_model=Discussion)
def get_discussion(discussion_id: uuid.UUID, session: Session = Depends(get_session)):
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return discussion

from app.models.domain import FinalReport

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
def continue_discussion(discussion_id: uuid.UUID, req: FollowUpRequest, session: Session = Depends(get_session)):
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    # In reality, fetch latest report_version
    from app.worker import start_discussion_task
    start_discussion_task.delay(
        str(discussion_id), discussion.question, discussion.selected_models, req.api_keys, discussion.discussion_depth,
        workflow_type="CONTINUE", parent_report_id=str(discussion_id), report_version=2
    )
    return {"status": "processing", "workflow_type": "CONTINUE"}

@router.post("/{discussion_id}/challenge")
def challenge_answer(discussion_id: uuid.UUID, req: FollowUpRequest, session: Session = Depends(get_session)):
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    from app.worker import start_discussion_task
    start_discussion_task.delay(
        str(discussion_id), discussion.question, discussion.selected_models, req.api_keys, discussion.discussion_depth,
        workflow_type="CHALLENGE", parent_report_id=str(discussion_id), report_version=2
    )
    return {"status": "processing", "workflow_type": "CHALLENGE"}
