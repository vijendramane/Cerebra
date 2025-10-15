from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    experiments = relationship("Experiment", back_populates="user")
    agent_tests = relationship("AgentTest", back_populates="user")

class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    domain = Column(String)  # NLP, CV, RL
    user_id = Column(Integer, ForeignKey("users.id"))
    agents = Column(JSON)  # List of agent types
    tasks = Column(JSON)  # List of tasks
    config = Column(JSON)  # Configuration
    status = Column(String, default="created")
    results = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="experiments")
    agent_tests = relationship("AgentTest", back_populates="experiment")

class AgentTest(Base):
    __tablename__ = "agent_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=True)
    agent_type = Column(String)
    task_type = Column(String)
    parameters = Column(JSON)
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="agent_tests")
    experiment = relationship("Experiment", back_populates="agent_tests")