from fastapi import APIRouter
from app.api.endpoints import discussion, ws

api_router = APIRouter()
api_router.include_router(discussion.router, prefix="/discussions", tags=["discussions"])
api_router.include_router(ws.router, prefix="/realtime", tags=["websocket"])

