"""
WebSocket Live Streaming Router & Connection Manager.
Handles /ws/live endpoint, live tick broadcasting, shock event alerts, and pipeline progress updates.
"""
import asyncio
import json
import logging
from typing import Any
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.user_connections: dict[str, list[WebSocket]] = {}
        self.advisor_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_info: dict | None = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_info:
            user_id = str(user_info.get("user_id", ""))
            role = user_info.get("role", "client")
            if user_id:
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = []
                self.user_connections[user_id].append(websocket)
            if role == "advisor":
                self.advisor_connections.append(websocket)
        logger.info(f"WebSocket connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.advisor_connections:
            self.advisor_connections.remove(websocket)
        for user_id, conns in list(self.user_connections.items()):
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self.user_connections.pop(user_id, None)
        logger.info(f"WebSocket disconnected. Remaining active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to a specific user's connected sockets."""
        conns = self.user_connections.get(str(user_id), [])
        if not conns:
            return
        payload = json.dumps(message)
        dead = []
        for conn in conns:
            try:
                await conn.send_text(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)

    async def broadcast_to_advisors(self, message: dict):
        """Send message only to advisor sockets."""
        if not self.advisor_connections:
            return
        payload = json.dumps(message)
        dead = []
        for conn in self.advisor_connections:
            try:
                await conn.send_text(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()


def decode_ws_token(token: str | None) -> dict | None:
    """Decode JWT token for WebSocket authentication."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return {
            "user_id": payload.get("sub"),
            "role": payload.get("role", "client"),
            "client_id": payload.get("client_id"),
        }
    except JWTError:
        return None


@router.websocket("/ws/live")
async def websocket_live_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None),
):
    user_info = decode_ws_token(token)
    await manager.connect(websocket, user_info)
    
    # Send initial welcome & connected message
    try:
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to ShockHarvester Live Market Feed",
            "authenticated": user_info is not None,
            "role": user_info.get("role") if user_info else "guest",
        })
        
        while True:
            # Keep-alive ping / pong handling
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": msg.get("timestamp")})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)
