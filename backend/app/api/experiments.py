from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Experiment, AgentTest
from app.api.auth import get_current_user

router = APIRouter()

class ExperimentCreate(BaseModel):
    name: str
    description: str
    domain: str  # NLP, Computer Vision, RL
    agents: List[str]
    tasks: List[str]
    config: Dict[str, Any]

class ExperimentResponse(BaseModel):
    id: int
    name: str
    description: str
    domain: str
    status: str
    created_at: datetime
    results: Optional[Dict]

@router.post("/create", response_model=ExperimentResponse)
async def create_experiment(
    experiment: ExperimentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new experiment"""
    db_experiment = Experiment(
        name=experiment.name,
        description=experiment.description,
        domain=experiment.domain,
        user_id=current_user.id,
        agents=experiment.agents,
        tasks=experiment.tasks,
        config=experiment.config,
        status="created",
        created_at=datetime.utcnow()
    )
    
    db.add(db_experiment)
    db.commit()
    db.refresh(db_experiment)
    
    return ExperimentResponse(
        id=db_experiment.id,
        name=db_experiment.name,
        description=db_experiment.description,
        domain=db_experiment.domain,
        status=db_experiment.status,
        created_at=db_experiment.created_at,
        results=None
    )

@router.post("/{experiment_id}/run")
async def run_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run an experiment"""
    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Update status
    experiment.status = "running"
    experiment.started_at = datetime.utcnow()
    db.commit()
    
    # Here you would trigger the actual experiment execution
    # This could involve running multiple agent tasks in parallel
    
    return {"message": "Experiment started", "experiment_id": experiment_id}

@router.get("/list", response_model=List[ExperimentResponse])
async def list_experiments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's experiments"""
    experiments = db.query(Experiment).filter(
        Experiment.user_id == current_user.id
    ).all()
    
    return [
        ExperimentResponse(
            id=exp.id,
            name=exp.name,
            description=exp.description,
            domain=exp.domain,
            status=exp.status,
            created_at=exp.created_at,
            results=exp.results
        )
        for exp in experiments
    ]

@router.get("/{experiment_id}/results")
async def get_experiment_results(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get experiment results"""
    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Get all agent tests for this experiment
    tests = db.query(AgentTest).filter(
        AgentTest.experiment_id == experiment_id
    ).all()
    
    results = {
        "experiment": {
            "id": experiment.id,
            "name": experiment.name,
            "status": experiment.status
        },
        "tests": [
            {
                "id": test.id,
                "agent_type": test.agent_type,
                "task_type": test.task_type,
                "result": test.result,
                "created_at": test.created_at
            }
            for test in tests
        ],
        "summary": calculate_experiment_summary(tests)
    }
    
    return results

def calculate_experiment_summary(tests):
    """Calculate summary statistics for experiment"""
    if not tests:
        return {}
    
    total_tests = len(tests)
    successful_tests = sum(1 for t in tests if t.result.get("status") == "completed")
    
    avg_quality = sum(
        t.result.get("metrics", {}).get("quality_score", 0) 
        for t in tests
    ) / total_tests if total_tests > 0 else 0
    
    return {
        "total_tests": total_tests,
        "successful_tests": successful_tests,
        "success_rate": successful_tests / total_tests if total_tests > 0 else 0,
        "average_quality_score": avg_quality
    }