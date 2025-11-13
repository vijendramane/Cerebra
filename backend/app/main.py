from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os
from datetime import datetime 
import uuid 
import time 
import asyncio      
from enum import Enum
from dotenv import load_dotenv
import httpx
import re
from huggingface_hub import InferenceClient

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Agent Testing Platform",
    description="Platform for testing and analyzing external AI agents",
    version="5.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class TaskType(str, Enum):
    IDEA_GENERATION = "idea_generation"
    PROPOSAL_WRITING = "proposal_writing"
    EXPERIMENT_DESIGN = "experiment_design"
    PAPER_WRITING = "paper_writing"
    LITERATURE_REVIEW = "literature_review"
    CODE_GENERATION = "code_generation"
    PROBLEM_SOLVING = "problem_solving"
    SUMMARIZATION = "summarization"

# Models
class TestRequest(BaseModel):
    """Request to test an AI agent"""
    agent_name: str
    agent_endpoint: str  # API endpoint of the agent
    agent_api_key: Optional[str] = None
    agent_type: str  # openai, anthropic, custom, etc.
    task_type: TaskType
    test_input: str  # The topic/question to test
    test_parameters: Optional[Dict] = {}

class AnalysisResult(BaseModel):
    """Analysis result for agent output"""
    overall_score: float
    grade: str
    metrics: Dict[str, Any]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    detailed_scores: Dict[str, float]

# Global storage for test results
class TestingPlatform:
    def __init__(self):
        self.test_results = []
        self.agent_profiles = {}
        self.comparison_data = {}
    
    def add_test_result(self, result: Dict):
        self.test_results.append(result)
        
        # Update agent profile
        agent_name = result["agent_name"]
        if agent_name not in self.agent_profiles:
            self.agent_profiles[agent_name] = {
                "total_tests": 0,
                "scores": [],
                "task_performance": {}
            }
        
        profile = self.agent_profiles[agent_name]
        profile["total_tests"] += 1
        if result["success"]:
            profile["scores"].append(result["analysis"]["overall_score"])
            
            task = result["task_type"]
            if task not in profile["task_performance"]:
                profile["task_performance"][task] = []
            profile["task_performance"][task].append(result["analysis"]["overall_score"])

platform = TestingPlatform()

# Agent Connector - Connects to external AI agents
class AgentConnector:
    """Connects to and executes external AI agents"""
    
    @staticmethod
    async def execute_agent(request: TestRequest) -> tuple[str, float]:
        """
        Send request to external AI agent and get response
        Returns: (response_text, execution_time)
        """
        start_time = time.time()
        
        # Generate the prompt based on task type
        prompt = AgentConnector._create_prompt(request.task_type, request.test_input)
        
        try:
            if request.agent_type == "openai":
                response = await AgentConnector._call_openai(
                    prompt, request.agent_endpoint, request.agent_api_key
                )
            elif request.agent_type == "anthropic":
                response = await AgentConnector._call_anthropic(
                    prompt, request.agent_endpoint, request.agent_api_key
                )
            elif request.agent_type == "google":
                response = await AgentConnector._call_google(
                    prompt, request.agent_endpoint, request.agent_api_key
                )
            elif request.agent_type == "huggingface":
                response = await AgentConnector._call_huggingface(
                    prompt, request.agent_endpoint, request.agent_api_key
                )
            else:
                # Custom API endpoint
                response = await AgentConnector._call_custom_api(
                    prompt, request.agent_endpoint, request.agent_api_key, request.test_parameters
                )
            
            execution_time = time.time() - start_time
            return response, execution_time
            
        except Exception as e:
            raise Exception(f"Failed to execute agent: {str(e)}")
    
    @staticmethod
    def _create_prompt(task_type: TaskType, test_input: str) -> str:
        """Create a standardized prompt for the task"""
        
        prompts = {
            TaskType.IDEA_GENERATION: f"Generate 5 innovative research ideas for: {test_input}",
            TaskType.PROPOSAL_WRITING: f"Write a research proposal for: {test_input}",
            TaskType.EXPERIMENT_DESIGN: f"Design an experiment to test: {test_input}",
            TaskType.PAPER_WRITING: f"Write an introduction section for a paper on: {test_input}",
            TaskType.LITERATURE_REVIEW: f"Provide a literature review on: {test_input}",
            TaskType.CODE_GENERATION: f"Write code to implement: {test_input}",
            TaskType.PROBLEM_SOLVING: f"Solve this problem: {test_input}",
            TaskType.SUMMARIZATION: f"Summarize the following: {test_input}"
        }
        
        return prompts.get(task_type, test_input)
    
    @staticmethod
    async def _call_openai(prompt: str, endpoint: str, api_key: str) -> str:
        """Call OpenAI API"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                endpoint or "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception(f"API error: {response.status_code} - {response.text}")
    
    @staticmethod
    async def _call_anthropic(prompt: str, endpoint: str, api_key: str) -> str:
        """Call Anthropic API"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                endpoint or "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2000
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["content"][0]["text"]
            else:
                raise Exception(f"API error: {response.status_code} - {response.text}")
    
    @staticmethod
    async def _call_google(prompt: str, endpoint: str, api_key: str) -> str:
        """Call Google Gemini API"""
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text
    
    @staticmethod
    async def _call_huggingface(prompt: str, endpoint: str, api_key: str) -> str:
        """Call HuggingFace API"""
        print(f"DEBUG - Endpoint: {endpoint}")
        print(f"DEBUG - API Key (first 10 chars): {api_key[:10]}...")
        print(f"DEBUG - Prompt: {prompt[:100]}...")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Try simple payload first
            payload = {"inputs": prompt}
            print(f"DEBUG - Payload: {payload}")
            
            response = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            print(f"DEBUG - Status Code: {response.status_code}")
            print(f"DEBUG - Response: {response.text[:500]}...")
            
            if response.status_code == 200:
                data = response.json()
                # Handle different response formats
                if isinstance(data, list):
                    if len(data) > 0:
                        if isinstance(data[0], dict):
                            return data[0].get("generated_text", str(data[0]))
                        return str(data[0])
                elif isinstance(data, dict):
                    return data.get("generated_text", data.get("text", str(data)))
                return str(data)
            elif response.status_code == 503:
                raise Exception(f"Model is loading, please try again in a few seconds")
            else:
                raise Exception(f"HuggingFace API error: {response.status_code} - {response.text}")

        
    @staticmethod
    async def _call_custom_api(prompt: str, endpoint: str, api_key: str, parameters: Dict) -> str:
        """Call custom API endpoint"""
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                endpoint,
                headers=headers,
                json={
                    "prompt": prompt,
                    "input": prompt,
                    "query": prompt,
                    **parameters
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                # Try to extract response from common field names
                if isinstance(data, str):
                    return data
                for field in ["output", "response", "text", "generated_text", "result", "completion"]:
                    if field in data:
                        return str(data[field])
                return str(data)
            else:
                raise Exception(f"API error: {response.status_code} - {response.text}")

# Response Analyzer - Analyzes AI agent outputs
class ResponseAnalyzer:
    """Analyzes and scores AI agent responses"""
    
    @staticmethod
    def analyze(response: str, task_type: TaskType, execution_time: float) -> AnalysisResult:
        """
        Analyze the response from an AI agent
        This is where we evaluate the quality of the agent's output
        """
        
        # Calculate different aspects of quality
        scores = {
            "relevance": ResponseAnalyzer._score_relevance(response, task_type),
            "completeness": ResponseAnalyzer._score_completeness(response, task_type),
            "clarity": ResponseAnalyzer._score_clarity(response),
            "structure": ResponseAnalyzer._score_structure(response),
            "depth": ResponseAnalyzer._score_depth(response),
            "accuracy": ResponseAnalyzer._score_accuracy(response, task_type),
            "creativity": ResponseAnalyzer._score_creativity(response, task_type),
            "coherence": ResponseAnalyzer._score_coherence(response)
        }
        
        # Basic metrics
        metrics = {
            "response_length": len(response),
            "word_count": len(response.split()),
            "sentence_count": len(re.split(r'[.!?]+', response)),
            "paragraph_count": len(response.split('\n\n')),
            "execution_time": round(execution_time, 2),
            "avg_sentence_length": len(response.split()) / max(1, len(re.split(r'[.!?]+', response)))
        }
        
        # Calculate overall score (weighted average)
        weights = {
            "relevance": 0.20,
            "completeness": 0.20,
            "clarity": 0.15,
            "structure": 0.10,
            "depth": 0.15,
            "accuracy": 0.10,
            "creativity": 0.05,
            "coherence": 0.05
        }
        
        overall_score = sum(scores[k] * weights[k] for k in scores) * 100
        
        # Determine grade
        if overall_score >= 90:
            grade = "A"
        elif overall_score >= 80:
            grade = "B"
        elif overall_score >= 70:
            grade = "C"
        elif overall_score >= 60:
            grade = "D"
        else:
            grade = "F"
        
        # Identify strengths and weaknesses
        strengths = []
        weaknesses = []
        
        for aspect, score in scores.items():
            if score >= 0.8:
                strengths.append(f"Excellent {aspect}")
            elif score < 0.5:
                weaknesses.append(f"Poor {aspect}")
        
        # Generate recommendations
        recommendations = ResponseAnalyzer._generate_recommendations(scores, task_type)
        
        return AnalysisResult(
            overall_score=round(overall_score, 2),
            grade=grade,
            metrics=metrics,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            detailed_scores={k: round(v * 100, 2) for k, v in scores.items()}
        )
    
    @staticmethod
    def _score_relevance(response: str, task_type: TaskType) -> float:
        """Score how relevant the response is to the task"""
        
        # Check for task-specific keywords
        relevance_keywords = {
            TaskType.IDEA_GENERATION: ["idea", "concept", "innovation", "approach", "solution"],
            TaskType.PROPOSAL_WRITING: ["objective", "methodology", "timeline", "budget", "outcome"],
            TaskType.EXPERIMENT_DESIGN: ["hypothesis", "method", "control", "variable", "measurement"],
            TaskType.PAPER_WRITING: ["abstract", "introduction", "conclusion", "reference", "analysis"],
            TaskType.LITERATURE_REVIEW: ["review", "study", "research", "finding", "paper"],
            TaskType.CODE_GENERATION: ["function", "class", "import", "return", "def"],
            TaskType.PROBLEM_SOLVING: ["solution", "step", "answer", "result", "approach"],
            TaskType.SUMMARIZATION: ["summary", "main", "key", "point", "conclusion"]
        }
        
        keywords = relevance_keywords.get(task_type, [])
        if not keywords:
            return 0.7
        
        found = sum(1 for kw in keywords if kw.lower() in response.lower())
        return min(1.0, found / len(keywords))
    
    @staticmethod
    def _score_completeness(response: str, task_type: TaskType) -> float:
        """Score how complete the response is"""
        
        # Minimum expected word counts for each task
        min_words = {
            TaskType.IDEA_GENERATION: 200,
            TaskType.PROPOSAL_WRITING: 500,
            TaskType.EXPERIMENT_DESIGN: 300,
            TaskType.PAPER_WRITING: 400,
            TaskType.LITERATURE_REVIEW: 500,
            TaskType.CODE_GENERATION: 50,
            TaskType.PROBLEM_SOLVING: 100,
            TaskType.SUMMARIZATION: 150
        }
        
        expected = min_words.get(task_type, 200)
        actual = len(response.split())
        
        if actual >= expected:
            return 1.0
        else:
            return actual / expected
    
    @staticmethod
    def _score_clarity(response: str) -> float:
        """Score the clarity of writing"""
        
        sentences = re.split(r'[.!?]+', response)
        sentences = [s for s in sentences if len(s.strip()) > 0]
        
        if not sentences:
            return 0.5
        
        # Check average sentence length
        avg_length = sum(len(s.split()) for s in sentences) / len(sentences)
        
        # Optimal sentence length is 15-20 words
        if 15 <= avg_length <= 20:
            clarity_score = 1.0
        elif 10 <= avg_length <= 25:
            clarity_score = 0.8
        elif avg_length < 10:
            clarity_score = 0.6
        else:
            clarity_score = 0.5
        
        return clarity_score
    
    @staticmethod
    def _score_structure(response: str) -> float:
        """Score the structure and organization"""
        
        # Check for structural elements
        has_paragraphs = len(response.split('\n\n')) > 1
        has_sections = any(line.startswith('#') for line in response.split('\n'))
        has_lists = any(re.match(r'^\s*[\d\-\*\•]', line) for line in response.split('\n'))
        has_formatting = '**' in response or '__' in response or '*' in response
        
        score = 0
        if has_paragraphs:
            score += 0.3
        if has_sections:
            score += 0.3
        if has_lists:
            score += 0.2
        if has_formatting:
            score += 0.2
        
        return score
    
    @staticmethod
    def _score_depth(response: str) -> float:
        """Score the depth and detail of the response"""
        
        # Check for detailed explanations
        detail_indicators = [
            "for example", "such as", "specifically", "in particular",
            "furthermore", "additionally", "moreover", "therefore",
            "because", "due to", "as a result", "consequently"
        ]
        
        detail_count = sum(1 for indicator in detail_indicators if indicator.lower() in response.lower())
        
        # Check for technical terms (simplified)
        technical_terms = [
            "algorithm", "methodology", "framework", "architecture",
            "implementation", "optimization", "evaluation", "analysis",
            "hypothesis", "validation", "correlation", "distribution"
        ]
        
        technical_count = sum(1 for term in technical_terms if term.lower() in response.lower())
        
        depth_score = min(1.0, (detail_count + technical_count) / 10)
        return depth_score
    
    @staticmethod
    def _score_accuracy(response: str, task_type: TaskType) -> float:
        """Score the accuracy (basic check - no hallucination detection)"""
        
        # Basic accuracy checks
        # Check if response is not just repetition
        lines = response.split('\n')
        unique_lines = set(lines)
        
        if len(unique_lines) < len(lines) * 0.5:
            return 0.3  # Too much repetition
        
        # Check for common filler phrases that indicate uncertainty
        filler_phrases = [
            "i don't know", "i'm not sure", "i cannot", "unable to",
            "no information", "cannot provide", "don't have"
        ]
        
        has_filler = any(phrase in response.lower() for phrase in filler_phrases)
        if has_filler:
            return 0.5
        
        return 0.8  # Default accuracy score
    
    @staticmethod
    def _score_creativity(response: str, task_type: TaskType) -> float:
        """Score creativity (especially for idea generation)"""
        
        if task_type not in [TaskType.IDEA_GENERATION, TaskType.PROBLEM_SOLVING]:
            return 0.7  # Neutral score for non-creative tasks
        
        # Check for creative indicators
        creative_words = [
            "innovative", "novel", "unique", "creative", "original",
            "breakthrough", "revolutionary", "pioneering", "cutting-edge",
            "unprecedented", "groundbreaking", "ingenious"
        ]
        
        creative_count = sum(1 for word in creative_words if word.lower() in response.lower())
        
        # Check for varied vocabulary
        words = response.lower().split()
        unique_words = set(words)
        vocabulary_diversity = len(unique_words) / len(words) if words else 0
        
        creativity_score = min(1.0, (creative_count / 5) * 0.5 + vocabulary_diversity * 0.5)
        return creativity_score
    
    @staticmethod
    def _score_coherence(response: str) -> float:
        """Score logical flow and coherence"""
        
        # Check for transition words
        transitions = [
            "first", "second", "third", "finally", "however",
            "therefore", "thus", "moreover", "furthermore",
            "in addition", "consequently", "as a result",
            "on the other hand", "in contrast", "similarly"
        ]
        
        transition_count = sum(1 for trans in transitions if trans.lower() in response.lower())
        
        # Check if ideas flow logically (simplified)
        paragraphs = response.split('\n\n')
        if len(paragraphs) > 1:
            coherence_score = min(1.0, 0.5 + (transition_count / 8))
        else:
            coherence_score = 0.6  # Single paragraph
        
        return coherence_score
    
    @staticmethod
    def _generate_recommendations(scores: Dict[str, float], task_type: TaskType) -> List[str]:
        """Generate specific recommendations based on scores"""
        
        recommendations = []
        
        if scores["relevance"] < 0.6:
            recommendations.append("Improve relevance by focusing more directly on the task requirements")
        
        if scores["completeness"] < 0.7:
            recommendations.append("Provide more comprehensive and detailed responses")
        
        if scores["clarity"] < 0.7:
            recommendations.append("Enhance clarity by using simpler sentence structures")
        
        if scores["structure"] < 0.6:
            recommendations.append("Improve organization with clear sections and formatting")
        
        if scores["depth"] < 0.6:
            recommendations.append("Add more depth with examples and detailed explanations")
        
        if scores["coherence"] < 0.6:
            recommendations.append("Improve logical flow with better transitions between ideas")
        
        if task_type == TaskType.IDEA_GENERATION and scores["creativity"] < 0.6:
            recommendations.append("Enhance creativity with more innovative and unique ideas")
        
        if task_type == TaskType.CODE_GENERATION and "```" not in scores:
            recommendations.append("Use proper code formatting with syntax highlighting")
        
        return recommendations

# API Endpoints

@app.get("/")
async def root():
    return {
        "name": "AI Agent Testing Platform",
        "version": "5.0.0",
        "description": "Test and analyze any AI agent's performance",
        "endpoints": {
            "test": "/api/test",
            "results": "/api/results",
            "comparison": "/api/comparison",
            "agents": "/api/agents"
        }
    }

@app.post("/api/test")
async def test_agent(request: TestRequest):
    """Test an AI agent with a specific task"""
    
    test_id = str(uuid.uuid4())
    start_time = datetime.now()
    
    try:
        # Get response from the external AI agent
        agent_response, execution_time = await AgentConnector.execute_agent(request)
        
        # Analyze the response
        analysis = ResponseAnalyzer.analyze(agent_response, request.task_type, execution_time)
        
        # Prepare test result
        test_result = {
            "test_id": test_id,
            "timestamp": start_time.isoformat(),
            "agent_name": request.agent_name,
            "agent_type": request.agent_type,
            "task_type": request.task_type.value,
            "test_input": request.test_input,
            "agent_response": agent_response,
            "execution_time": execution_time,
            "analysis": analysis.dict(),
            "success": True
        }
        
        # Store result
        platform.add_test_result(test_result)
        
        return test_result
        
    except Exception as e:
        # Handle errors
        error_result = {
            "test_id": test_id,
            "timestamp": start_time.isoformat(),
            "agent_name": request.agent_name,
            "task_type": request.task_type.value,
            "test_input": request.test_input,
            "error": str(e),
            "success": False
        }
        
        platform.add_test_result(error_result)
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results")
async def get_results(limit: int = 20):
    """Get recent test results"""
    
    results = platform.test_results[-limit:]
    results.reverse()  # Most recent first
    
    return {
        "total_tests": len(platform.test_results),
        "results": results
    }

@app.get("/api/agents")
async def get_agent_profiles():
    """Get profiles of all tested agents"""
    
    profiles = []
    
    for agent_name, data in platform.agent_profiles.items():
        avg_score = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
        
        profile = {
            "agent_name": agent_name,
            "total_tests": data["total_tests"],
            "average_score": round(avg_score, 2),
            "grade": "A" if avg_score >= 90 else "B" if avg_score >= 80 else "C" if avg_score >= 70 else "D" if avg_score >= 60 else "F",
            "task_performance": {}
        }
        
        for task, scores in data["task_performance"].items():
            profile["task_performance"][task] = {
                "tests": len(scores),
                "average": round(sum(scores) / len(scores), 2) if scores else 0
            }
        
        profiles.append(profile)
    
    # Sort by average score
    profiles.sort(key=lambda x: x["average_score"], reverse=True)
    
    return profiles

@app.get("/api/comparison")
async def compare_agents():
    """Compare all tested agents"""
    
    comparison = []
    
    for agent_name, data in platform.agent_profiles.items():
        if data["scores"]:
            avg_score = sum(data["scores"]) / len(data["scores"])
            
            comparison.append({
                "agent_name": agent_name,
                "total_tests": data["total_tests"],
                "average_score": round(avg_score, 2),
                "best_score": round(max(data["scores"]), 2),
                "worst_score": round(min(data["scores"]), 2),
                "consistency": round(100 - (max(data["scores"]) - min(data["scores"])), 2)
            })
    
    comparison.sort(key=lambda x: x["average_score"], reverse=True)
    
    return {
        "agents_tested": len(comparison),
        "comparison": comparison,
        "best_performer": comparison[0] if comparison else None
    }

@app.get("/api/metrics")
async def get_metrics():
    """Get platform statistics"""
    
    total_tests = len(platform.test_results)
    successful_tests = len([r for r in platform.test_results if r.get("success")])
    
    task_distribution = {}
    for result in platform.test_results:
        task = result.get("task_type", "unknown")
        task_distribution[task] = task_distribution.get(task, 0) + 1
    
    return {
        "total_tests": total_tests,
        "successful_tests": successful_tests,
        "failed_tests": total_tests - successful_tests,
        "success_rate": round(successful_tests / total_tests * 100, 2) if total_tests > 0 else 0,
        "agents_tested": len(platform.agent_profiles),
        "task_distribution": task_distribution
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
