from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.prompts import PLANNER_PROMPT, CONTEXT_PROMPT, TASK_PROMPT, RESEARCH_PROMPT, REFLECTION_PROMPT
from app.services.memory_engine import MemoryEngine
from app.database.session import SessionLocal
import time

def planner_node(state: AgentState) -> AgentState:
    """
    Planner Agent analyzing user input and forming a multi-step execution schedule.
    """
    query = state["input_query"]
    logs = list(state.get("agent_logs", []))
    
    logs.append({
        "agent": "Planner Agent",
        "message": f"Analyzing query structure. Deconstructing relative temporal markers and conceptual keywords for: '{query}'."
    })
    
    # Simulate a deep planning process
    plan = (
        f"1. Context recall for: '{query}'\n"
        f"2. Graph semantic hop mapping.\n"
        f"3. Task action checks."
    )
    
    return {
        **state,
        "planner_plan": plan,
        "agent_logs": logs,
        "current_step": "context"
    }

def context_node(state: AgentState) -> AgentState:
    """
    Context Agent executing hybrid retrieval over vectors, associations, and timelines.
    """
    query = state["input_query"]
    user_id = state["user_id"]
    logs = list(state.get("agent_logs", []))
    
    db = SessionLocal()
    try:
        memories = MemoryEngine.retrieve_context(db, user_id, query, limit=4)
    finally:
        db.close()
        
    logs.append({
        "agent": "Context Agent",
        "message": f"Successfully retrieved {len(memories)} matching episodic, semantic, and graph-connected memories."
    })
    
    return {
        **state,
        "retrieved_memories": memories,
        "agent_logs": logs,
        "current_step": "task"
    }

def task_node(state: AgentState) -> AgentState:
    """
    Task Agent validating active action lists, scheduling, and predicting proactive tasks.
    """
    query = state["input_query"].lower()
    logs = list(state.get("agent_logs", []))
    active_tasks = []
    
    # Auto task detection from query strings
    if any(keyword in query for keyword in ["remind", "todo", "schedule", "task", "buy", "meet", "study"]):
        task_desc = f"Proactive Action Item: Complete task related to '{state['input_query']}'"
        active_tasks.append(task_desc)
        logs.append({
            "agent": "Task Agent",
            "message": f"Identified proactive todo/reminder: '{task_desc}'."
        })
    else:
        logs.append({
            "agent": "Task Agent",
            "message": "Scanned user context. No active new action schedules required."
        })
        
    return {
        **state,
        "active_tasks": active_tasks,
        "agent_logs": logs,
        "current_step": "research"
    }

def research_node(state: AgentState) -> AgentState:
    """
    Research Agent simulating deep web/knowledge synthesis.
    """
    query = state["input_query"]
    logs = list(state.get("agent_logs", []))
    
    logs.append({
        "agent": "Research Agent",
        "message": f"Evaluating external context for: '{query}'. Synced background parameters."
    })
    
    research_results = f"Distributed Systems Knowledge Base verified for '{query}'."
    
    return {
        **state,
        "research_results": research_results,
        "agent_logs": logs,
        "current_step": "reflection"
    }

def reflection_node(state: AgentState) -> AgentState:
    """
    Reflection Agent reviewing intermediate traces, applying emotional weighting, and building final response.
    """
    query = state["input_query"]
    memories = state["retrieved_memories"]
    logs = list(state.get("agent_logs", []))
    tasks = state["active_tasks"]
    
    logs.append({
        "agent": "Reflection Agent",
        "message": "Synthesizing retrieved memories and building premium contextualized response."
    })
    
    # Core reasoning logic combining recalled memory chunks
    if memories:
        top_mem = memories[0]
        source_note = f" (recalled from our conversation on {top_mem['created_at'][:10]})"
        response = (
            f"Active Memory Recall: Regarding your question about '{query}', "
            f"I remember we previously discussed: '{top_mem['content']}'{source_note}.\n\n"
            f"How does this relate to what you are building today?"
        )
    else:
        response = (
            f"Initializing Cognitive Session: I don't see any matching historical memories for '{query}' "
            f"in our long-term logs. However, I have established a new cognitive tracking anchor. "
            f"Let's explore this together!"
        )
        
    if tasks:
        response += f"\n\n*Proactive Task Generated:* {tasks[0]}"
        
    return {
        **state,
        "final_response": response,
        "agent_logs": logs,
        "current_step": "complete"
    }

# Build LangGraph StateGraph Workflow
workflow = StateGraph(AgentState)

# Add Node mapping
workflow.add_node("planner", planner_node)
workflow.add_node("context", context_node)
workflow.add_node("task", task_node)
workflow.add_node("research", research_node)
workflow.add_node("reflection", reflection_node)

# Set execution path
workflow.set_entry_point("planner")
workflow.add_edge("planner", "context")
workflow.add_edge("context", "task")
workflow.add_edge("task", "research")
workflow.add_edge("research", "reflection")
workflow.add_edge("reflection", END)

# Compile LangGraph app
cognitive_graph = workflow.compile()
