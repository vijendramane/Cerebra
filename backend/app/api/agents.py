from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import asyncio

from app.agents.research_agent import ResearchAgent
from app.db.models import User, AgentTest
from app.api.auth import get_current_user
from app.db.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

class AgentTaskRequest(BaseModel):
    agent_type: str  # gemini, groq
    task_type: str  # idea_generation, proposal_writing, etc.
    parameters: Dict[str, Any]
    
class AgentTaskResponse(BaseModel):
    task_id: str
    status: str
    message: str

# Store for tracking tasks (in production, use Redis)
task_store = {}

@router.post("/execute-task", response_model=AgentTaskResponse)
async def execute_agent_task(
    request: AgentTaskRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Execute an agent task"""
    task_id = str(uuid.uuid4())
    
    # Store task status
    task_store[task_id] = {
        "status": "processing",
        "result": None,
        "error": None
    }
    
    # Create agent
    agent = ResearchAgent(
        agent_type=request.agent_type,
        task_type=request.task_type
    )
    
    # Create task
    task = {
        "id": task_id,
        "type": request.task_type,
        "parameters": request.parameters
    }
    
    # Execute in background
    background_tasks.add_task(
        process_agent_task,
        agent,
        task,
        task_id,
        db
    )
    
    return AgentTaskResponse(
        task_id=task_id,
        status="processing",
        message="Task submitted successfully"
    )

async def process_agent_task(
    agent: ResearchAgent,
    task: Dict,
    task_id: str,
    db: Session
):
    """Process agent task in background"""
    try:
        result = await agent.execute_task(task)
        
        # Update task store
        task_store[task_id] = {
            "status": "completed",
            "result": result,
            "error": None
        }
        
        # Save to database (without user_id for now since this is background task)
        test_record = AgentTest(
            user_id=1,  # Default user for demo
            agent_type=agent.agent_type,
            task_type=task["type"],
            parameters=task["parameters"],
            result=result,
            created_at=datetime.utcnow()
        )
        db.add(test_record)
        db.commit()
        
    except Exception as e:
        task_store[task_id] = {
            "status": "failed",
            "result": None,
            "error": str(e)
        }

@router.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a task"""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task_store[task_id]

@router.get("/available-agents")
async def get_available_agents():
    """Get list of available agents"""
    return {
        "agents": [
            {
                "id": "gemini",
                "name": "Google Gemini",
                "description": "Google's Gemini Pro model for research tasks",
                "capabilities": ["idea_generation", "proposal_writing", "paper_writing", "literature_review", "experiment_design"]
            },
            {
                "id": "groq",
                "name": "Groq LPU",
                "description": "Fast inference with Groq",
                "capabilities": ["idea_generation", "experiment_design", "literature_review"]
            }
        ]
    }

@router.get("/task-types")
async def get_task_types():
    """Get available task types"""
    return {
        "tasks": [
            {
                "id": "idea_generation",
                "name": "Idea Generation",
                "description": "Generate research ideas for ML topics",
                "category": "ideation"
            },
            {
                "id": "proposal_writing",
                "name": "Proposal Writing",
                "description": "Write research proposals",
                "category": "writing"
            },
            {
                "id": "experiment_design",
                "name": "Experiment Design",
                "description": "Design ML experiments",
                "category": "experimentation"
            },
            {
                "id": "paper_writing",
                "name": "Paper Writing",
                "description": "Write research paper sections",
                "category": "writing"
            },
            {
                "id": "literature_review",
                "name": "Literature Review",
                "description": "Conduct literature reviews",
                "category": "research"
            }
        ]
    }