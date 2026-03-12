import json
import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from .auth import get_current_user, User

router = APIRouter(prefix="/config", tags=["config"])

CONFIG_FILE = "user_config.json"

class ConfigRequest(BaseModel):
    llm_provider: Optional[str] = None
    deep_think_llm: Optional[str] = None
    quick_think_llm: Optional[str] = None
    backend_url: Optional[str] = None
    api_key: Optional[str] = None  # Optional, to set env var temporarily or save securely?
    max_debate_rounds: Optional[int] = None

@router.get("/", response_model=Dict[str, Any])
async def get_config(current_user: User = Depends(get_current_user)):
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

@router.post("/", response_model=Dict[str, Any])
async def update_config(config: ConfigRequest, current_user: User = Depends(get_current_user)):
    current_config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            try:
                current_config = json.load(f)
            except json.JSONDecodeError:
                pass

    # Update fields if provided
    if config.llm_provider is not None:
        current_config["llm_provider"] = config.llm_provider
    if config.deep_think_llm is not None:
        current_config["deep_think_llm"] = config.deep_think_llm
    if config.quick_think_llm is not None:
        current_config["quick_think_llm"] = config.quick_think_llm
    if config.backend_url is not None:
        current_config["backend_url"] = config.backend_url
    if config.max_debate_rounds is not None:
        current_config["max_debate_rounds"] = config.max_debate_rounds
    
    # Handle API Key securely (for now, maybe just save to a separate secrets file or env)
    # The spec says "Safe: do not land plaintext keys in repo; inject secrets at deployment".
    # But for user dashboard usage, we might want to save it locally for convenience.
    # Let's save it to .env or a separate secrets file that is gitignored.
    if config.api_key:
        # We won't return the API key in the response for security
        # We will save it to a .env file or similar that is loaded by the app
        # For simplicity in this demo, let's assume we set it in the process environment for now
        # But that won't persist across restarts unless we write to .env
        pass 

    with open(CONFIG_FILE, "w") as f:
        json.dump(current_config, f, indent=4)
    
    return current_config
