from typing import Dict, List, Any, Optional
from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from groq import Groq
import json
import asyncio
from datetime import datetime

class ResearchAgent:
    """ML Research Agent for various research tasks"""
    
    def __init__(self, agent_type: str = "gemini", task_type: str = "general"):
        self.agent_type = agent_type
        self.task_type = task_type
        self.memory = ConversationBufferMemory()
        self.llm = self._initialize_llm()
        self.tools = self._create_tools()
        
    def _initialize_llm(self):
        """Initialize LLM based on agent type"""
        if self.agent_type == "gemini":
            from app.core.config import settings
            return ChatGoogleGenerativeAI(
                model="gemini-pro",
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=0.7
            )
        elif self.agent_type == "groq":
            from app.core.config import settings
            client = Groq(api_key=settings.GROQ_API_KEY)
            return client  # Groq client wrapper needed
        else:
            raise ValueError(f"Unknown agent type: {self.agent_type}")
    
    def _create_tools(self) -> List[Tool]:
        """Create tools for the research agent"""
        tools = []
        
        # Idea Generation Tool
        tools.append(Tool(
            name="IdeaGenerator",
            func=self._generate_ideas,
            description="Generate research ideas for ML topics"
        ))
        
        # Proposal Writer Tool
        tools.append(Tool(
            name="ProposalWriter",
            func=self._write_proposal,
            description="Write research proposals for ML projects"
        ))
        
        # Experiment Designer Tool
        tools.append(Tool(
            name="ExperimentDesigner",
            func=self._design_experiment,
            description="Design experiments for ML research"
        ))
        
        # Paper Writer Tool
        tools.append(Tool(
            name="PaperWriter",
            func=self._write_paper,
            description="Write sections of research papers"
        ))
        
        # Literature Review Tool
        tools.append(Tool(
            name="LiteratureReview",
            func=self._literature_review,
            description="Conduct literature review on ML topics"
        ))
        
        return tools
    
    async def _generate_ideas(self, topic: str) -> str:
        """Generate research ideas for a given ML topic"""
        prompt = f"""
        Generate 5 innovative research ideas for the following ML topic: {topic}
        
        For each idea, provide:
        1. Title
        2. Brief description
        3. Potential impact
        4. Key challenges
        
        Focus on practical and novel approaches.
        """
        
        response = await self._async_llm_call(prompt)
        return response
    
    async def _write_proposal(self, idea: str) -> str:
        """Write a research proposal for a given idea"""
        prompt = f"""
        Write a detailed research proposal for the following idea: {idea}
        
        Include:
        1. Abstract
        2. Introduction and Motivation
        3. Related Work
        4. Proposed Methodology
        5. Expected Outcomes
        6. Timeline
        7. Required Resources
        """
        
        response = await self._async_llm_call(prompt)
        return response
    
    async def _design_experiment(self, hypothesis: str) -> str:
        """Design an experiment for testing a hypothesis"""
        prompt = f"""
        Design a comprehensive ML experiment for testing: {hypothesis}
        
        Include:
        1. Experimental Setup
        2. Datasets to use
        3. Baseline models
        4. Evaluation metrics
        5. Statistical tests
        6. Expected results
        """
        
        response = await self._async_llm_call(prompt)
        return response
    
    async def _write_paper(self, section: str, content: str) -> str:
        """Write a section of a research paper"""
        prompt = f"""
        Write the {section} section of a research paper based on: {content}
        
        Follow standard academic writing style.
        Include proper citations format (use [1], [2], etc. for references).
        Be technical and precise.
        """
        
        response = await self._async_llm_call(prompt)
        return response
    
    async def _literature_review(self, topic: str) -> str:
        """Conduct a literature review on a topic"""
        prompt = f"""
        Conduct a literature review on: {topic}
        
        Include:
        1. Key papers and contributions
        2. Evolution of the field
        3. Current state-of-the-art
        4. Open challenges
        5. Future directions
        """
        
        response = await self._async_llm_call(prompt)
        return response
    
    async def _async_llm_call(self, prompt: str) -> str:
        """Async wrapper for LLM calls"""
        try:
            # For Gemini
            if self.agent_type == "gemini":
                response = self.llm.invoke(prompt)
                return response.content
            # For Groq
            elif self.agent_type == "groq":
                # Implement Groq-specific call
                pass
            else:
                return "Agent type not supported"
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a research task"""
        task_type = task.get("type")
        parameters = task.get("parameters", {})
        
        result = {
            "task_id": task.get("id"),
            "task_type": task_type,
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "result": None,
            "metrics": {}
        }
        
        try:
            if task_type == "idea_generation":
                output = await self._generate_ideas(parameters.get("topic"))
            elif task_type == "proposal_writing":
                output = await self._write_proposal(parameters.get("idea"))
            elif task_type == "experiment_design":
                output = await self._design_experiment(parameters.get("hypothesis"))
            elif task_type == "paper_writing":
                output = await self._write_paper(
                    parameters.get("section"),
                    parameters.get("content")
                )
            elif task_type == "literature_review":
                output = await self._literature_review(parameters.get("topic"))
            else:
                raise ValueError(f"Unknown task type: {task_type}")
            
            result["result"] = output
            result["metrics"] = self._calculate_metrics(output)
            
        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)
        
        return result
    
    def _calculate_metrics(self, output: str) -> Dict[str, Any]:
        """Calculate metrics for the output"""
        return {
            "output_length": len(output),
            "word_count": len(output.split()),
            "completeness": self._assess_completeness(output),
            "quality_score": self._assess_quality(output)
        }
    
    def _assess_completeness(self, output: str) -> float:
        """Assess completeness of the output (0-1)"""
        # Simple heuristic based on length
        word_count = len(output.split())
        if word_count < 100:
            return 0.3
        elif word_count < 300:
            return 0.6
        elif word_count < 500:
            return 0.8
        else:
            return 0.95
    
    def _assess_quality(self, output: str) -> float:
        """Assess quality of the output (0-1)"""
        # Placeholder for quality assessment
        # Could integrate with evaluation models
        return 0.75