from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from .auth import get_current_user, User
from .tasks import tasks_store

router = APIRouter(prefix="/results", tags=["results"])

class AnalysisReport(BaseModel):
    market: Optional[str] = None
    sentiment: Optional[str] = None
    news: Optional[str] = None
    fundamentals: Optional[str] = None

class DebateState(BaseModel):
    history: Optional[List[Dict[str, Any]]] = None
    judge_decision: Optional[str] = None

class RiskState(BaseModel):
    history: Optional[List[Dict[str, Any]]] = None
    judge_decision: Optional[str] = None

class FullResult(BaseModel):
    company: Optional[str] = None
    date: Optional[str] = None
    analysis: Optional[AnalysisReport] = None
    research: Optional[DebateState] = None
    risk: Optional[RiskState] = None
    trader_plan: Optional[str] = None
    final_decision: Optional[str] = None
    raw_decision: Optional[str] = None

@router.get("/{task_id}", response_model=FullResult)
async def get_task_result(task_id: str, current_user: User = Depends(get_current_user)):
    if task_id not in tasks_store:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks_store[task_id]
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Task not completed yet")
    
    state = task.get("result", {})
    decision = task.get("decision")
    
    # If state is not a dict (e.g. mock result might be simpler), handle gracefully
    if not isinstance(state, dict):
         return FullResult(
             company=task.get("ticker"),
             date=task.get("date"),
             raw_decision=str(state)
         )

    return FullResult(
        company=state.get("company_of_interest", task.get("ticker")),
        date=state.get("trade_date", task.get("date")),
        analysis=AnalysisReport(
            market=state.get("market_report"),
            sentiment=state.get("sentiment_report"),
            news=state.get("news_report"),
            fundamentals=state.get("fundamentals_report")
        ),
        research=DebateState(
            history=state.get("investment_debate_state", {}).get("history"),
            judge_decision=state.get("investment_debate_state", {}).get("judge_decision")
        ),
        risk=RiskState(
            history=state.get("risk_debate_state", {}).get("history"),
            judge_decision=state.get("risk_debate_state", {}).get("judge_decision")
        ),
        trader_plan=state.get("trader_investment_plan"),
        final_decision=state.get("final_trade_decision"),
        raw_decision=str(decision) if decision else None
    )
