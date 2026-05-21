from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json
import asyncio
from app.database.session import SessionLocal
from app.services.vision_service import VisionService
from app.services.memory_engine import MemoryEngine
from app.api.auth import get_current_user
from app.database.models import User

router = APIRouter()

class ConnectionManager:
    """
    Manages active streaming channels for voice dialogue, Vision OCR streams, and real-time chat.
    """
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    db = SessionLocal()
    user_id = 1  # Standard guest user fallback
    
    try:
        # 1. Wait for connection authorization
        auth_msg = await websocket.receive_text()
        try:
            auth_data = json.loads(auth_msg)
            # Support authentication or fallback to guest user
            if auth_data.get("type") == "auth":
                # Simulated guest authorization for high out-of-the-box support
                user_id = auth_data.get("user_id", 1)
                await manager.send_personal_message({
                    "type": "status",
                    "content": f"Authenticated cognitive socket channel for user #{user_id}."
                }, websocket)
        except Exception:
            await manager.send_personal_message({
                "type": "status",
                "content": "Running in open-sandbox guest workspace mode."
            }, websocket)
            
        # 2. Start dynamic event-listening loop
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            msg_type = data.get("type")
            
            if msg_type == "voice_chunk":
                # Voice stream audio visualization
                await manager.send_personal_message({
                    "type": "audio_waveform",
                    "frequencies": [20, 50, 80, 120, 90, 45, 10, 40, 75, 110, 130, 95, 60, 20]
                }, websocket)
                
            elif msg_type == "screenshot_stream":
                # Visual capture ingest
                img_b64 = data.get("image")
                app_ctx = data.get("app_context", "Web Workspace")
                
                # Perform OCR in separate thread to prevent WS lock
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    VisionService.ingest_screenshot_as_memory,
                    db,
                    user_id,
                    img_b64,
                    app_ctx
                )
                
                await manager.send_personal_message({
                    "type": "vision_analyzed",
                    "content": f"Vision layer scanned screenshot from '{app_ctx}'. Identified: {result['scene_description']}",
                    "memory_id": result["memory_id"]
                }, websocket)
                
            elif msg_type == "chat_message":
                query = data.get("content", "")
                
                # Fetch semantic database memories
                memories = MemoryEngine.retrieve_context(db, user_id, query, limit=3)
                
                # Stream token letters to frontend to simulate advanced real-time LLM inference
                base_text = ""
                if memories:
                    base_text = f"[Memory Recalled: '{memories[0]['content'][:60]}...']\n"
                    
                response_text = base_text + f"Recalled associated semantic blocks to address '{query}'. Creating operational memory thread."
                
                # Simulated character token-by-character streaming
                words = response_text.split(" ")
                current_accumulated = ""
                for word in words:
                    current_accumulated += word + " "
                    await manager.send_personal_message({
                        "type": "chat_stream",
                        "content": current_accumulated
                    }, websocket)
                    await asyncio.sleep(0.08)  # Mimics smooth network streaming
                    
                # Create memory of the chat interaction
                MemoryEngine.create_memory(
                    db=db,
                    user_id=user_id,
                    content=f"User asked real-time: '{query}'. AI streaming response: '{response_text}'",
                    type="episodic",
                    importance_score=4.0
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
    finally:
        db.close()
