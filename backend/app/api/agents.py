from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import User
from app.api.auth import get_current_user
from app.agents.graph import cognitive_graph
from app.services.memory_engine import MemoryEngine

router = APIRouter()

class AgentRunInput(BaseModel):
    query: str

class AgentRunResponse(BaseModel):
    query: str
    response: str
    execution_logs: List[Dict[str, str]]
    recalled_memories: List[Dict[str, Any]]
    generated_tasks: List[str]

@router.post("/run", response_model=AgentRunResponse)
def run_agent_workflow(
    input_data: AgentRunInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers the compiled LangGraph cognitive agent pipeline.
    Invokes the multi-agent Planner-Context-Task-Research-Reflection loop
    and returns full logs and traces.
    """
    initial_state = {
        "user_id": current_user.id,
        "input_query": input_data.query,
        "planner_plan": "",
        "retrieved_memories": [],
        "active_tasks": [],
        "agent_logs": [],
        "research_results": "",
        "final_response": "",
        "current_step": "init"
    }
    
    try:
        # Invoke the multi-agent graph
        final_state = cognitive_graph.invoke(initial_state)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LangGraph execution exception: {str(e)}"
        )
        
    # Write the response back to episodic memory (so the agent learns and remembers the interactions!)
    MemoryEngine.create_memory(
        db=db,
        user_id=current_user.id,
        content=f"User requested: '{input_data.query}'. AI Agent responded: '{final_state.get('final_response')}'",
        type="episodic",
        importance_score=5.0,
        temporal_tags=["agent_session"]
    )
    
    return {
        "query": input_data.query,
        "response": final_state.get("final_response", "Cognitive loop failed to produce response."),
        "execution_logs": final_state.get("agent_logs", []),
        "recalled_memories": final_state.get("retrieved_memories", []),
        "generated_tasks": final_state.get("active_tasks", [])
    }
