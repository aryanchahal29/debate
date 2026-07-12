from fastapi import APIRouter
from app.api.endpoints import discussion, ws, providers

api_router = APIRouter()
api_router.include_router(discussion.router, prefix="/discussions", tags=["discussions"])
api_router.include_router(ws.router, prefix="/realtime", tags=["websocket"])
api_router.include_router(providers.router, prefix="/providers", tags=["providers"])

