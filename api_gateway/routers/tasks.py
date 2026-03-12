from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from .auth import get_current_user, User
import sys
import os

import json

# Add parent directory to path to import tradingagents
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# We need to handle potential import errors if dependencies are missing in the environment
try:
    from tradingagents.graph.trading_graph import TradingAgentsGraph
    from tradingagents.default_config import DEFAULT_CONFIG
except ImportError:
    # Mock for development if dependencies are missing
    print("Warning: Could not import tradingagents. Using mock.")
    TradingAgentsGraph = None
    DEFAULT_CONFIG = {}

router = APIRouter(prefix="/tasks", tags=["tasks"])

# In-memory store for demo purposes (replace with DB in production)
tasks_store = {}

CONFIG_FILE = "user_config.json"

class TaskRequest(BaseModel):
    ticker: str
    date: str
    provider: Optional[str] = None
    model: Optional[str] = None

class TaskResponse(BaseModel):
    task_id: str
    status: str
    ticker: Optional[str] = None
    date: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

def run_trading_agent(task_id: str, ticker: str, date: str, provider: Optional[str] = None, model: Optional[str] = None):
    try:
        tasks_store[task_id]["status"] = "running"
        
        if TradingAgentsGraph is None:
            import time
            time.sleep(5)
            tasks_store[task_id]["status"] = "completed"
            tasks_store[task_id]["result"] = {"decision": "buy", "reason": "Mock result"}
            return

        # Initialize Graph
        config = DEFAULT_CONFIG.copy()
        
        # Load user config overrides
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    user_config = json.load(f)
                    config.update(user_config)
            except Exception as e:
                print(f"Error loading config: {e}")

        # Request-specific overrides
        if provider:
            config["llm_provider"] = provider
        if model:
            # Depending on which model the user wants to override, usually deep_think_llm is the main one
            config["deep_think_llm"] = model
            config["quick_think_llm"] = model # Use same for both if simple override
        
        ta = TradingAgentsGraph(debug=True, config=config)
        # Assuming propagate returns (state, decision)
        state, decision = ta.propagate(ticker, date)
        
        tasks_store[task_id]["status"] = "completed"
        tasks_store[task_id]["result"] = state
        tasks_store[task_id]["decision"] = decision
    except Exception as e:
        tasks_store[task_id]["status"] = "failed"
        tasks_store[task_id]["error"] = str(e)

@router.post("/", response_model=TaskResponse)
async def create_task(
    request: TaskRequest, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    task_id = str(uuid.uuid4())
    tasks_store[task_id] = {
        "id": task_id,
        "ticker": request.ticker,
        "date": request.date,
        "status": "pending",
        "created_by": current_user.username
    }
    
    background_tasks.add_task(
        run_trading_agent, 
        task_id, 
        request.ticker, 
        request.date,
        request.provider,
        request.model
    )
    
    return {
        "task_id": task_id,
        "status": "pending",
        "ticker": request.ticker,
        "date": request.date
    }

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: User = Depends(get_current_user)):
    if task_id not in tasks_store:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks_store[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "ticker": task.get("ticker"),
        "date": task.get("date"),
        "result": task.get("result"),
        "error": task.get("error")
    }

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(current_user: User = Depends(get_current_user)):
    return [
        {
            "task_id": t["id"],
            "status": t["status"],
            "ticker": t.get("ticker"),
            "date": t.get("date"),
            "result": t.get("result"),
            "error": t.get("error")
        }
        for t in tasks_store.values()
    ]
