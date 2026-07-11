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
