from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    """
    Defines the structured, shared cognitive state of the LangGraph multi-agent loop.
    Enables deep multi-hop tracing of active reasoning steps.
    """
    user_id: int
    input_query: str
    planner_plan: Optional[str]
    retrieved_memories: List[Dict[str, Any]]
    active_tasks: List[str]
    agent_logs: List[Dict[str, str]]  # Records: {"agent": "ContextAgent", "message": "Parsed contextual memories"}
    research_results: Optional[str]
    final_response: Optional[str]
    current_step: str
