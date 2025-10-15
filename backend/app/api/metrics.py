from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import User, Experiment, AgentTest
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard metrics for the current user"""
    
    # Get counts
    total_experiments = db.query(Experiment).filter(
        Experiment.user_id == current_user.id
    ).count()
    
    total_tests = db.query(AgentTest).filter(
        AgentTest.user_id == current_user.id
    ).count()
    
    # Get recent tests
    recent_tests = db.query(AgentTest).filter(
        AgentTest.user_id == current_user.id
    ).order_by(AgentTest.created_at.desc()).limit(10).all()
    
    # Calculate success rate
    successful_tests = db.query(AgentTest).filter(
        AgentTest.user_id == current_user.id,
        AgentTest.result['status'].astext == 'completed'
    ).count()
    
    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    
    # Agent usage distribution
    agent_usage = {}
    tests = db.query(AgentTest).filter(AgentTest.user_id == current_user.id).all()
    for test in tests:
        agent_usage[test.agent_type] = agent_usage.get(test.agent_type, 0) + 1
    
    return {
        "total_experiments": total_experiments,
        "total_tests": total_tests,
        "success_rate": success_rate,
        "agent_usage": agent_usage,
        "recent_tests": [
            {
                "id": test.id,
                "agent_type": test.agent_type,
                "task_type": test.task_type,
                "created_at": test.created_at
            }
            for test in recent_tests
        ]
    }

@router.get("/performance")
async def get_performance_metrics(
    agent_type: str = None,
    task_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics for agents and tasks"""
    
    query = db.query(AgentTest).filter(AgentTest.user_id == current_user.id)
    
    if agent_type:
        query = query.filter(AgentTest.agent_type == agent_type)
    if task_type:
        query = query.filter(AgentTest.task_type == task_type)
    
    tests = query.all()
    
    metrics = {
        "total_tests": len(tests),
        "average_quality": 0,
        "average_completeness": 0,
        "task_distribution": {},
        "time_series": []
    }
    
    if tests:
        quality_scores = []
        completeness_scores = []
        
        for test in tests:
            if test.result and 'metrics' in test.result:
                quality_scores.append(test.result['metrics'].get('quality_score', 0))
                completeness_scores.append(test.result['metrics'].get('completeness', 0))
            
            # Task distribution
            task = test.task_type
            metrics["task_distribution"][task] = metrics["task_distribution"].get(task, 0) + 1
        
        metrics["average_quality"] = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        metrics["average_completeness"] = sum(completeness_scores) / len(completeness_scores) if completeness_scores else 0
    
    return metrics