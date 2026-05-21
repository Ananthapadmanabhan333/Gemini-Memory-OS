import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.database.models import Memory, ModalityMetadata, TemporalInterval, User
from app.database.vector_store import vector_store
from app.database.graph_store import graph_store

class MemoryEngine:
    """
    Cognitive Memory Engine which acts as the hybrid orchestrator.
    It fuses:
    1. Relational DB (SQLAlchemy/SQLite) for structured tags and operational schemas
    2. Vector index (NumPy/Cosine Similarity) for semantic matching
    3. Spatial Graph DB (NetworkX) for relational multi-hop association tracing
    4. Adaptive Decay Engine for mathematical memory consolidation
    """
    
    @staticmethod
    def create_memory(
        db: Session,
        user_id: int,
        content: str,
        type: str = "episodic",
        emotional_weight: float = 0.0,
        importance_score: float = 5.0,
        modalities: Optional[List[Dict[str, Any]]] = None,
        temporal_tags: Optional[List[str]] = None
    ) -> Memory:
        # 1. Store in Relational SQL Database
        db_memory = Memory(
            user_id=user_id,
            content=content,
            type=type,
            emotional_weight=emotional_weight,
            importance_score=importance_score,
            decay_rate=0.05,
            created_at=datetime.now(timezone.utc).replace(tzinfo=None),
            updated_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)
        
        # Add Modality Metadata if present
        if modalities:
            for mod in modalities:
                db_mod = ModalityMetadata(
                    memory_id=db_memory.id,
                    file_path=mod.get("file_path"),
                    file_type=mod.get("file_type", "text"),
                    metadata_json=mod.get("metadata", {})
                )
                db.add(db_mod)
                
        # Add Temporal intervals
        if temporal_tags:
            for tag in temporal_tags:
                db_temp = TemporalInterval(
                    memory_id=db_memory.id,
                    name=tag,
                    start_time=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1),
                    end_time=datetime.now(timezone.utc).replace(tzinfo=None)
                )
                db.add(db_temp)
                
        db.commit()
        db.refresh(db_memory)
        
        # 2. Add to Local Vector Store
        vector_store.add_memory(db_memory.id, content)
        
        # 3. Add node to Cognitive Relationship Graph
        label_text = content[:30] + "..." if len(content) > 30 else content
        graph_store.add_node(
            db_memory.id,
            label=f"[{type.upper()}] {label_text}",
            metadata={"type": type, "importance": importance_score}
        )
        
        # Auto-associate with chronologically previous memories to form a time-series graph
        prev_memories = db.query(Memory).filter(
            Memory.user_id == user_id, 
            Memory.id < db_memory.id
        ).order_by(Memory.id.desc()).limit(3).all()
        
        for idx, prev in enumerate(prev_memories):
            rel_type = "PRECEDES" if idx == 0 else "TEMPORALLY_RELATED"
            graph_store.add_edge(prev.id, db_memory.id, relation=rel_type, weight=1.0 / (idx + 1))
            
        # Semantic Auto-Association: Find semantic matches and link them in the graph
        semantic_matches = vector_store.search(content, limit=5)
        for match_id, score in semantic_matches:
            if match_id != db_memory.id and score > 0.65:
                # Add bi-directional relation
                graph_store.add_edge(db_memory.id, match_id, relation="SEMANTICALLY_ASSOCIATED", weight=score)
                graph_store.add_edge(match_id, db_memory.id, relation="SEMANTICALLY_ASSOCIATED", weight=score)
                
        return db_memory

    @staticmethod
    def retrieve_context(db: Session, user_id: int, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Gathers multidimensional context by blending semantic similarity, 
        graph neighbor associations, and calculating temporal decay.
        """
        # 1. Semantic Recall via Vector Store
        semantic_hits = vector_store.search(query, limit=limit)
        if not semantic_hits:
            return []
            
        retrieved_contexts = {}
        now = datetime.now(timezone.utc)
        
        # Get user specific decay factor
        user = db.query(User).filter(User.id == user_id).first()
        base_decay = user.cognitive_decay_rate if user else 0.05
        
        # 2. Extract Relational Information and process Temporal Decay
        for memory_id, similarity in semantic_hits:
            mem = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == user_id).first()
            if not mem:
                continue
                
            # Calculate Time Decay: Importance = S * e^(-lambda * days)
            delta = now - mem.created_at.replace(tzinfo=timezone.utc)
            days_passed = max(delta.days + (delta.seconds / 86400.0), 0.001)
            decay_factor = math.exp(-base_decay * days_passed)
            
            # Recurrence reinforcement boost
            reinforcement_boost = 1.0 + (mem.reinforcement_count * 0.15)
            emotional_valence = abs(mem.emotional_weight) * 0.1
            
            adjusted_score = (mem.importance_score * decay_factor * similarity * reinforcement_boost) + emotional_valence
            
            # Fetch Modal metadata
            modalities_list = []
            for mod in mem.modalities:
                modalities_list.append({
                    "file_type": mod.file_type,
                    "file_path": mod.file_path,
                    "metadata": mod.metadata_json
                })
                
            retrieved_contexts[mem.id] = {
                "id": mem.id,
                "content": mem.content,
                "type": mem.type,
                "created_at": mem.created_at.isoformat(),
                "original_importance": mem.importance_score,
                "current_relevance": adjusted_score,
                "modalities": modalities_list,
                "source": "semantic"
            }
            
            # 3. Multi-Hop Graph Tracing
            related_nodes = graph_store.get_related_nodes(mem.id, max_depth=1)
            for rel_id, node_attrs, relation in related_nodes:
                if rel_id in retrieved_contexts:
                    # Boost existing semantic hit relevance
                    retrieved_contexts[rel_id]["current_relevance"] += 0.25
                else:
                    # Pull associated memory through cognitive graph
                    assoc_mem = db.query(Memory).filter(Memory.id == rel_id, Memory.user_id == user_id).first()
                    if assoc_mem:
                        delta_assoc = now - assoc_mem.created_at.replace(tzinfo=timezone.utc)
                        days_passed_assoc = max(delta_assoc.days + (delta_assoc.seconds / 86400.0), 0.001)
                        decay_assoc = math.exp(-base_decay * days_passed_assoc)
                        
                        assoc_score = (assoc_mem.importance_score * decay_assoc * 0.5)  # Scale down graph link score
                        
                        retrieved_contexts[assoc_mem.id] = {
                            "id": assoc_mem.id,
                            "content": assoc_mem.content,
                            "type": assoc_mem.type,
                            "created_at": assoc_mem.created_at.isoformat(),
                            "original_importance": assoc_mem.importance_score,
                            "current_relevance": assoc_score,
                            "modalities": [],
                            "source": f"graph_association ({relation})"
                        }
                        
        # Reinforce active hits in relational memory database
        for hit_id in retrieved_contexts.keys():
            mem_to_reinforce = db.query(Memory).filter(Memory.id == hit_id).first()
            if mem_to_reinforce:
                mem_to_reinforce.reinforcement_count += 1
        db.commit()
        
        # Sort contexts by current adjusted relevance
        sorted_contexts = list(retrieved_contexts.values())
        sorted_contexts.sort(key=lambda x: x["current_relevance"], reverse=True)
        return sorted_contexts[:limit]

    @staticmethod
    def compress_and_decay_memories(db: Session, user_id: int) -> Dict[str, Any]:
        """
        Autonomous Consolidation Pipeline. Summarizes multiple sparse episodic memories
        into single high-level semantic summaries, updating the relational database
        and indices to prevent context-window overflow.
        """
        # Select old episodic memories with low importance
        cutoff_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=2)
        sparse_memories = db.query(Memory).filter(
            Memory.user_id == user_id,
            Memory.type == "episodic",
            Memory.created_at < cutoff_date,
            Memory.importance_score < 4.0
        ).all()
        
        if len(sparse_memories) < 3:
            return {"status": "skipped", "reason": "Insufficient eligible memories for compression."}
            
        # Combine texts into a consolidated semantic memory
        combined_text = " Consolidated Cognitive Summary:\n"
        for mem in sparse_memories:
            combined_text += f"- [{mem.created_at.strftime('%Y-%m-%d')}]: {mem.content}\n"
            # Delete individual vector and graph indices
            vector_store.delete_memory(mem.id)
            graph_store.delete_node(mem.id)
            db.delete(mem)
            
        # Write new consolidated memory
        consolidated = MemoryEngine.create_memory(
            db=db,
            user_id=user_id,
            content=combined_text,
            type="semantic",
            importance_score=7.0,
            temporal_tags=["archive"]
        )
        
        db.commit()
        return {
            "status": "success",
            "compressed_count": len(sparse_memories),
            "new_memory_id": consolidated.id,
            "summary": combined_text
        }
