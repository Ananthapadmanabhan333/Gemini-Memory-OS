import pytest
import os
import sys
from datetime import datetime, timezone, timedelta

# Incorporate root project into path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal, Base, engine
from app.database.models import User, Memory
from app.services.memory_engine import MemoryEngine
from app.services.temporal_reasoning import TemporalReasoningEngine
from app.database.vector_store import vector_store
from app.database.graph_store import graph_store

@pytest.fixture(scope="module")
def db_session():
    # Setup in-memory sqlite instance for fully sandboxed unit tests
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_user_creation_and_decay_rates(db_session):
    user = User(
        email="test_engineer@talent.os",
        hashed_password="hashed_strength_pass",
        full_name="DeepMind Reviewer",
        cognitive_decay_rate=0.04
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    assert user.id is not None
    assert user.cognitive_decay_rate == 0.04

def test_semantic_vector_indexing():
    vector_store.add_memory(999, "Implementing distributed consensus raft protocols on Neo4j clusters.")
    results = vector_store.search("raft protocols", limit=1)
    
    assert len(results) > 0
    assert results[0][0] == 999
    assert results[0][1] > 0.5  # Positive cosine similarity matching

def test_cognitive_graph_multi_hop():
    graph_store.add_node(100, "Node A", {"type": "episodic"})
    graph_store.add_node(101, "Node B", {"type": "semantic"})
    graph_store.add_edge(100, 101, "SEMANTICALLY_ASSOCIATED", weight=0.9)
    
    related = graph_store.get_related_nodes(100, max_depth=1)
    assert len(related) > 0
    assert related[0][0] == 101
    assert related[0][2] == "SEMANTICALLY_ASSOCIATED"

def test_relative_temporal_parsing():
    cleaned, start, end, custom_tag = TemporalReasoningEngine.parse_temporal_query("What did I code yesterday?")
    assert "yesterday" not in cleaned
    assert start is not None
    assert end is not None
    assert (end - start).days <= 1

def test_hybrid_memory_injection(db_session):
    user = db_session.query(User).filter(User.email == "test_engineer@talent.os").first()
    
    mem = MemoryEngine.create_memory(
        db=db_session,
        user_id=user.id,
        content="Finalized unit test assertions for advanced AI platforms.",
        type="episodic",
        importance_score=8.5,
        temporal_tags=["testing", "ci_cd"]
    )
    
    assert mem.id is not None
    assert mem.content == "Finalized unit test assertions for advanced AI platforms."
    
    # Verify vector store holds the new record
    hits = vector_store.search("unit test assertions", limit=1)
    assert len(hits) > 0
    assert hits[0][0] == mem.id
