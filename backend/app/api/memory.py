from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.database.session import get_db
from app.database.models import User, Memory
from app.api.auth import get_current_user
from app.services.memory_engine import MemoryEngine
from app.services.temporal_reasoning import TemporalReasoningEngine
from app.database.graph_store import graph_store

router = APIRouter()

# Pydantic Schemas
class MemoryCreate(BaseModel):
    content: str
    type: str = "episodic"  # episodic, semantic, procedural, working
    emotional_weight: float = 0.0
    importance_score: float = 5.0
    modalities: Optional[List[Dict[str, Any]]] = None
    temporal_tags: Optional[List[str]] = None

class MemoryResponse(BaseModel):
    id: int
    content: str
    type: str
    emotional_weight: float
    importance_score: float
    created_at: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=Dict[str, Any])
def create_memory(
    mem_in: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = MemoryEngine.create_memory(
        db=db,
        user_id=current_user.id,
        content=mem_in.content,
        type=mem_in.type,
        emotional_weight=mem_in.emotional_weight,
        importance_score=mem_in.importance_score,
        modalities=mem_in.modalities,
        temporal_tags=mem_in.temporal_tags
    )
    return {
        "status": "success",
        "memory_id": mem.id,
        "content": mem.content,
        "type": mem.type
    }

@router.get("/", response_model=List[Dict[str, Any]])
def get_all_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mems = db.query(Memory).filter(Memory.user_id == current_user.id).order_by(Memory.created_at.desc()).all()
    results = []
    for mem in mems:
        results.append({
            "id": mem.id,
            "content": mem.content,
            "type": mem.type,
            "emotional_weight": mem.emotional_weight,
            "importance_score": mem.importance_score,
            "created_at": mem.created_at.isoformat(),
            "reinforcement_count": mem.reinforcement_count,
            "modalities": [{"file_type": mod.file_type} for mod in mem.modalities]
        })
    return results

@router.delete("/{memory_id}")
def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    # Delete from Relational DB
    db.delete(mem)
    db.commit()
    
    # Delete from Vector and Graph indices
    from app.database.vector_store import vector_store
    vector_store.delete_memory(memory_id)
    graph_store.delete_node(memory_id)
    
    return {"status": "success", "message": f"Memory {memory_id} successfully deleted from all indices"}

@router.get("/search")
def search_similar_memories(
    query: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = MemoryEngine.retrieve_context(db, current_user.id, query, limit)
    return {
        "query": query,
        "contexts": results
    }

@router.get("/timeline")
def get_temporal_timeline(
    query: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Leverages TemporalReasoningEngine to parse relative chronological strings
    and filter relational databases accordingly.
    """
    timeline = TemporalReasoningEngine.filter_chronological_memories(db, current_user.id, query)
    return {
        "parsed_filter": query,
        "timeline": timeline
    }

@router.get("/graph")
def get_cognitive_graph(
    current_user: User = Depends(get_current_user)
):
    """
    Returns full D3-compatible nodes and association edges mapping the active graph state.
    """
    return graph_store.get_d3_graph()

@router.post("/compress")
def compress_cognitive_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually triggers the memory compaction pipeline.
    """
    result = MemoryEngine.compress_and_decay_memories(db, current_user.id)
    return result
