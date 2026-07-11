from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import uuid

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, discussion_id: uuid.UUID):
        await websocket.accept()
        if discussion_id not in self.active_connections:
            self.active_connections[discussion_id] = []
        self.active_connections[discussion_id].append(websocket)

    def disconnect(self, websocket: WebSocket, discussion_id: uuid.UUID):
        if discussion_id in self.active_connections:
            self.active_connections[discussion_id].remove(websocket)

    async def broadcast(self, message: str, discussion_id: uuid.UUID):
        if discussion_id in self.active_connections:
            for connection in self.active_connections[discussion_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{discussion_id}")
async def websocket_endpoint(websocket: WebSocket, discussion_id: uuid.UUID):
    await manager.connect(websocket, discussion_id)
    try:
        while True:
            # We don't expect client to send much, mostly we broadcast updates
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, discussion_id)
