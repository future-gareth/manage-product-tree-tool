from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import httpx
import asyncio
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Local AI Model Configuration
LOCAL_MODEL_ENDPOINT = os.getenv("LOCAL_MODEL_ENDPOINT", "http://localhost:11434")  # Ollama default
LOCAL_MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "llama3.2:3b")  # Lightweight local model
LOCAL_MODEL_TIMEOUT = int(os.getenv("LOCAL_MODEL_TIMEOUT", "30"))  # Seconds
AI_INTEGRATION_ENABLED = os.getenv("AI_INTEGRATION_ENABLED", "true").lower() == "true"

app = FastAPI(title="Standalone Dot Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class NodeRequest(BaseModel):
    node_id: str
    title: str
    type: str
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    team: Optional[str] = None
    owner: Optional[str] = None
    effort: Optional[str] = None
    parent_id: Optional[str] = None

class UpdateNodeRequest(BaseModel):
    node_id: str
    updates: Dict[str, Any]

class DeleteNodeRequest(BaseModel):
    node_id: str

class ChatResponse(BaseModel):
    response: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

# Internal AI model simulation
class InternalAIModel:
    def __init__(self):
        self.name = "Internal AI Model"
        self.version = "1.0.0"
        
    async def generate_response(self, message: str, context: Dict[str, Any] = None) -> str:
        """Generate a response using internal AI logic"""
        
        # Simple keyword-based responses for product tree management
        message_lower = message.lower()
        
        if "product tree" in message_lower or "tree" in message_lower:
            if "analyze" in message_lower or "analysis" in message_lower:
                return self._analyze_product_tree(context)
            elif "suggest" in message_lower or "recommend" in message_lower:
                return self._suggest_improvements(context)
            elif "status" in message_lower:
                return self._analyze_status(context)
            else:
                return self._general_tree_response(context)
        
        elif "goal" in message_lower:
            return self._analyze_goals(context)
        
        elif "job" in message_lower or "epic" in message_lower:
            return self._analyze_jobs(context)
        
        elif "work item" in message_lower or "story" in message_lower:
            return self._analyze_work_items(context)
        
        elif "priority" in message_lower:
            return self._analyze_priorities(context)
        
        elif "team" in message_lower:
            return self._analyze_teams(context)
        
        else:
            return self._general_response(message, context)
    
    def _analyze_product_tree(self, context: Dict[str, Any]) -> str:
        """Analyze the overall product tree structure"""
        if not context or 'productTree' not in context:
            return "I'd be happy to analyze your product tree! Please import a Product Tree XML file first so I can provide specific insights."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        
        if not nodes:
            return "Your product tree appears to be empty. Consider adding some products, goals, and work items to get started."
        
        # Count different node types
        counts = {}
        for node in nodes:
            node_type = node.get('type', 'unknown')
            counts[node_type] = counts.get(node_type, 0) + 1
        
        analysis = f"## Product Tree Analysis\n\n"
        analysis += f"**Total Nodes:** {len(nodes)}\n"
        analysis += f"**Structure:** "
        
        if 'product' in counts:
            analysis += f"{counts['product']} products"
        if 'goal' in counts:
            analysis += f", {counts['goal']} goals"
        if 'job' in counts:
            analysis += f", {counts['job']} jobs"
        if 'work_item' in counts:
            analysis += f", {counts['work_item']} work items"
        
        analysis += "\n\n"
        
        # Analyze status distribution
        status_counts = {}
        for node in nodes:
            status = node.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        if status_counts:
            analysis += "**Status Distribution:**\n"
            for status, count in status_counts.items():
                percentage = (count / len(nodes)) * 100
                analysis += f"- {status.replace('_', ' ').title()}: {count} ({percentage:.1f}%)\n"
        
        return analysis
    
    def _suggest_improvements(self, context: Dict[str, Any]) -> str:
        """Suggest improvements for the product tree"""
        if not context or 'productTree' not in context:
            return "To provide improvement suggestions, please import a Product Tree XML file first."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        
        suggestions = "## Improvement Suggestions\n\n"
        
        # Check for missing descriptions
        missing_descriptions = [node for node in nodes if not node.get('description')]
        if missing_descriptions:
            suggestions += f"**📝 Add Descriptions:** {len(missing_descriptions)} nodes are missing descriptions. Adding clear descriptions helps team members understand the purpose and scope of each item.\n\n"
        
        # Check for missing priorities
        missing_priorities = [node for node in nodes if not node.get('priority')]
        if missing_priorities:
            suggestions += f"**⚡ Set Priorities:** {len(missing_priorities)} nodes don't have priority levels. Consider setting P0 (critical), P1 (high), P2 (medium), or P3 (low) priorities.\n\n"
        
        # Check for missing teams
        missing_teams = [node for node in nodes if not node.get('team')]
        if missing_teams:
            suggestions += f"**👥 Assign Teams:** {len(missing_teams)} nodes don't have assigned teams. Assigning teams helps with accountability and resource planning.\n\n"
        
        # Check for blocked items
        blocked_items = [node for node in nodes if node.get('status') == 'blocked']
        if blocked_items:
            suggestions += f"**🚫 Address Blockers:** {len(blocked_items)} items are currently blocked. Review these items and identify actions to unblock them.\n\n"
        
        # Check for items in progress
        in_progress = [node for node in nodes if node.get('status') in ['in_progress', 'active']]
        if in_progress:
            suggestions += f"**🔄 Monitor Progress:** {len(in_progress)} items are currently in progress. Regular status updates help keep stakeholders informed.\n\n"
        
        if len(suggestions) == len("## Improvement Suggestions\n\n"):
            suggestions += "**✅ Great job!** Your product tree looks well-structured. Consider regular reviews to keep it updated and aligned with your goals."
        
        return suggestions
    
    def _analyze_status(self, context: Dict[str, Any]) -> str:
        """Analyze the status distribution across the product tree"""
        if not context or 'productTree' not in context:
            return "Please import a Product Tree XML file to analyze status distribution."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        
        status_counts = {}
        for node in nodes:
            status = node.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        analysis = "## Status Analysis\n\n"
        
        total = len(nodes)
        for status, count in sorted(status_counts.items()):
            percentage = (count / total) * 100
            status_display = status.replace('_', ' ').title()
            analysis += f"**{status_display}:** {count} items ({percentage:.1f}%)\n"
        
        # Provide insights
        analysis += "\n**Insights:**\n"
        
        if status_counts.get('completed', 0) > 0:
            completion_rate = (status_counts['completed'] / total) * 100
            analysis += f"- Completion rate: {completion_rate:.1f}%\n"
        
        if status_counts.get('blocked', 0) > 0:
            blocked_rate = (status_counts['blocked'] / total) * 100
            analysis += f"- Blocked items: {blocked_rate:.1f}% (consider addressing blockers)\n"
        
        if status_counts.get('in_progress', 0) > 0:
            active_rate = (status_counts['in_progress'] / total) * 100
            analysis += f"- Active work: {active_rate:.1f}%\n"
        
        return analysis
    
    def _analyze_goals(self, context: Dict[str, Any]) -> str:
        """Analyze goals in the product tree"""
        if not context or 'productTree' not in context:
            return "Please import a Product Tree XML file to analyze goals."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        goals = [node for node in nodes if node.get('type') == 'goal']
        
        if not goals:
            return "No goals found in your product tree. Consider adding strategic goals to guide your product development."
        
        analysis = f"## Goals Analysis\n\n"
        analysis += f"**Total Goals:** {len(goals)}\n\n"
        
        # Analyze goal status
        goal_status = {}
        for goal in goals:
            status = goal.get('status', 'unknown')
            goal_status[status] = goal_status.get(status, 0) + 1
        
        analysis += "**Goal Status:**\n"
        for status, count in goal_status.items():
            percentage = (count / len(goals)) * 100
            analysis += f"- {status.replace('_', ' ').title()}: {count} ({percentage:.1f}%)\n"
        
        # List goals without descriptions
        goals_no_desc = [goal for goal in goals if not goal.get('description')]
        if goals_no_desc:
            analysis += f"\n**⚠️ Goals without descriptions:** {len(goals_no_desc)}\n"
            analysis += "Consider adding clear descriptions to help team members understand the goal's purpose and success criteria.\n"
        
        return analysis
    
    def _analyze_jobs(self, context: Dict[str, Any]) -> str:
        """Analyze jobs/epics in the product tree"""
        if not context or 'productTree' not in context:
            return "Please import a Product Tree XML file to analyze jobs/epics."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        jobs = [node for node in nodes if node.get('type') == 'job']
        
        if not jobs:
            return "No jobs/epics found in your product tree. Consider breaking down goals into specific jobs/epics."
        
        analysis = f"## Jobs/Epics Analysis\n\n"
        analysis += f"**Total Jobs/Epics:** {len(jobs)}\n\n"
        
        # Analyze effort estimates
        jobs_with_effort = [job for job in jobs if job.get('job_data', {}).get('effort_estimate')]
        if jobs_with_effort:
            analysis += f"**Jobs with effort estimates:** {len(jobs_with_effort)}/{len(jobs)}\n"
            
            # Calculate total effort
            total_effort = 0
            for job in jobs_with_effort:
                try:
                    effort = float(job['job_data']['effort_estimate'])
                    total_effort += effort
                except (ValueError, TypeError):
                    pass
            
            if total_effort > 0:
                analysis += f"**Total estimated effort:** {total_effort} story points\n"
        else:
            analysis += "**⚠️ No effort estimates found.** Consider adding story point estimates to help with planning and resource allocation.\n"
        
        # Analyze job content
        jobs_with_content = [job for job in jobs if job.get('job_data', {}).get('job_content')]
        analysis += f"\n**Jobs with detailed content:** {len(jobs_with_content)}/{len(jobs)}\n"
        
        if len(jobs_with_content) < len(jobs):
            analysis += "Consider adding detailed job content (user stories, acceptance criteria) to help developers understand requirements.\n"
        
        return analysis
    
    def _analyze_work_items(self, context: Dict[str, Any]) -> str:
        """Analyze work items/stories in the product tree"""
        if not context or 'productTree' not in context:
            return "Please import a Product Tree XML file to analyze work items/stories."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        work_items = [node for node in nodes if node.get('type') in ['work_item', 'work']]
        
        if not work_items:
            return "No work items/stories found in your product tree. Consider breaking down jobs/epics into specific work items."
        
        analysis = f"## Work Items/Stories Analysis\n\n"
        analysis += f"**Total Work Items:** {len(work_items)}\n\n"
        
        # Analyze status distribution
        status_counts = {}
        for item in work_items:
            status = item.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        analysis += "**Status Distribution:**\n"
        for status, count in status_counts.items():
            percentage = (count / len(work_items)) * 100
            analysis += f"- {status.replace('_', ' ').title()}: {count} ({percentage:.1f}%)\n"
        
        # Analyze team distribution
        team_counts = {}
        for item in work_items:
            team = item.get('team', 'Unassigned')
            team_counts[team] = team_counts.get(team, 0) + 1
        
        if len(team_counts) > 1:  # More than just 'Unassigned'
            analysis += "\n**Team Distribution:**\n"
            for team, count in team_counts.items():
                percentage = (count / len(work_items)) * 100
                analysis += f"- {team}: {count} ({percentage:.1f}%)\n"
        
        return analysis
    
    def _analyze_priorities(self, context: Dict[str, Any]) -> str:
        """Analyze priority distribution across the product tree"""
        if not context or 'productTree' not in context:
            return "Please import a Product Tree XML file to analyze priorities."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        
        priority_counts = {}
        for node in nodes:
            priority = node.get('priority', 'Unset')
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        analysis = "## Priority Analysis\n\n"
        
        total = len(nodes)
        for priority in ['P0', 'P1', 'P2', 'P3', 'Unset']:
            count = priority_counts.get(priority, 0)
            if count > 0:
                percentage = (count / total) * 100
                analysis += f"**{priority}:** {count} items ({percentage:.1f}%)\n"
        
        # Provide insights
        high_priority = priority_counts.get('P0', 0) + priority_counts.get('P1', 0)
        if high_priority > 0:
            high_priority_rate = (high_priority / total) * 100
            analysis += f"\n**High Priority Items (P0+P1):** {high_priority} ({high_priority_rate:.1f}%)\n"
        
        unset_priorities = priority_counts.get('Unset', 0)
        if unset_priorities > 0:
            analysis += f"\n**⚠️ Items without priorities:** {unset_priorities}\n"
            analysis += "Consider setting priorities to help with resource allocation and planning.\n"
        
        return analysis
    
    def _analyze_teams(self, context: Dict[str, Any]) -> str:
        """Analyze team distribution across the product tree"""
        if not context or 'productTree' not in context:
            return "Please import a Product Tree XML file to analyze team distribution."
        
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        
        team_counts = {}
        for node in nodes:
            team = node.get('team', 'Unassigned')
            team_counts[team] = team_counts.get(team, 0) + 1
        
        analysis = "## Team Analysis\n\n"
        
        total = len(nodes)
        for team, count in sorted(team_counts.items()):
            percentage = (count / total) * 100
            analysis += f"**{team}:** {count} items ({percentage:.1f}%)\n"
        
        unassigned = team_counts.get('Unassigned', 0)
        if unassigned > 0:
            unassigned_rate = (unassigned / total) * 100
            analysis += f"\n**⚠️ Unassigned items:** {unassigned} ({unassigned_rate:.1f}%)\n"
            analysis += "Consider assigning teams to improve accountability and resource planning.\n"
        
        return analysis
    
    def _general_tree_response(self, context: Dict[str, Any]) -> str:
        """General response about the product tree"""
        if not context or 'productTree' not in context:
            return "I'm here to help you manage your product tree! Import a Product Tree XML file and I can provide insights, suggestions, and analysis."
        
        return "I can help you analyze your product tree structure, suggest improvements, and provide insights about your goals, jobs, and work items. What would you like to know?"
    
    def _general_response(self, message: str, context: Dict[str, Any]) -> str:
        """General response for other queries"""
        return f"I understand you're asking about: '{message}'. I'm specialized in product tree management and can help you with:\n\n- Analyzing your product tree structure\n- Suggesting improvements\n- Reviewing status and priorities\n- Team distribution analysis\n- Goal and job analysis\n\nPlease import a Product Tree XML file first, then ask me specific questions about your product tree!"

# Initialize the AI model
ai_model = InternalAIModel()

# Local AI Model Integration
async def call_local_model(prompt: str, context: Dict[str, Any] = None) -> str:
    """Call local AI model for AI-powered responses"""
    try:
        if not AI_INTEGRATION_ENABLED:
            return None
            
        # Build context-aware prompt
        enhanced_prompt = build_context_prompt(prompt, context)
        
        # Try Ollama first (most common local model server)
        if LOCAL_MODEL_ENDPOINT.endswith("11434"):
            # Ollama format
            data = {
                "model": LOCAL_MODEL_NAME,
                "prompt": enhanced_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 1000
                }
            }
            
            async with httpx.AsyncClient(timeout=LOCAL_MODEL_TIMEOUT) as client:
                response = await client.post(
                    f"{LOCAL_MODEL_ENDPOINT}/api/generate",
                    json=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "")
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
        
        # Try generic OpenAI-compatible format (for LM Studio, vLLM, etc.)
        else:
            data = {
                "model": LOCAL_MODEL_NAME,
                "messages": [
                    {"role": "system", "content": "You are an expert product management assistant specializing in product tree analysis and strategic insights."},
                    {"role": "user", "content": enhanced_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            async with httpx.AsyncClient(timeout=LOCAL_MODEL_TIMEOUT) as client:
                response = await client.post(
                    f"{LOCAL_MODEL_ENDPOINT}/v1/chat/completions",
                    json=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("choices", [{}])[0].get("message", {}).get("content", "")
                else:
                    logger.error(f"OpenAI-compatible API error: {response.status_code} - {response.text}")
        
        return None
        
    except Exception as e:
        logger.error(f"Local model call failed: {e}")
        return None

def build_context_prompt(user_message: str, context: Dict[str, Any] = None) -> str:
    """Build a context-aware prompt for the AI model"""
    
    prompt = f"""You are an expert product management assistant specializing in product tree analysis and strategic insights. You help teams understand their product hierarchy, identify issues, and suggest improvements.

USER QUESTION: {user_message}

"""
    
    if context and context.get('productTree'):
        tree = context['productTree']
        nodes = tree.get('nodes', [])
        
        if nodes:
            prompt += f"""PRODUCT TREE CONTEXT:
You have access to a product tree with {len(nodes)} nodes. Here's the structure:

"""
            
            # Analyze the tree structure
            node_types = {}
            status_counts = {}
            priority_counts = {}
            
            for node in nodes:
                node_type = node.get('type', 'unknown')
                status = node.get('status', 'unknown')
                priority = node.get('priority', 'unknown')
                
                node_types[node_type] = node_types.get(node_type, 0) + 1
                status_counts[status] = status_counts.get(status, 0) + 1
                priority_counts[priority] = priority_counts.get(priority, 0) + 1
            
            prompt += f"""TREE STRUCTURE:
- Node Types: {', '.join([f'{k}: {v}' for k, v in node_types.items()])}
- Status Distribution: {', '.join([f'{k}: {v}' for k, v in status_counts.items()])}
- Priority Distribution: {', '.join([f'{k}: {v}' for k, v in priority_counts.items()])}

"""
            
            # Add sample nodes for context
            sample_nodes = nodes[:5]  # First 5 nodes
            prompt += "SAMPLE NODES:\n"
            for node in sample_nodes:
                prompt += f"- {node.get('type', 'unknown')}: {node.get('title', 'Untitled')} (Status: {node.get('status', 'unknown')}, Priority: {node.get('priority', 'unknown')})\n"
            
            if len(nodes) > 5:
                prompt += f"... and {len(nodes) - 5} more nodes\n"
        
        prompt += """
ANALYSIS GUIDELINES:
1. Provide specific insights based on the actual data provided
2. Identify patterns, issues, or opportunities in the product tree
3. Suggest concrete improvements or next steps
4. Be data-driven and reference specific nodes when relevant
5. Keep responses concise but actionable
6. Use Futurematic terminology (products, goals, jobs, work items)

CRUD OPERATIONS:
You can help users manage their product tree by:
- Creating new nodes (products, goals, jobs, work items)
- Updating existing nodes (status, priority, team, owner, etc.)
- Deleting nodes that are no longer needed
- Viewing detailed information about any node

When users ask to create, update, or delete nodes, provide specific guidance on:
- What type of node to create
- What fields to populate
- How to structure the hierarchy
- Best practices for product tree management

"""
    
    prompt += """RESPONSE FORMAT:
- Start with a direct answer to the user's question
- Provide specific insights based on the data
- Include actionable recommendations if appropriate
- Keep the response under 200 words unless more detail is specifically requested

Please provide a helpful, data-driven response:"""
    
    return prompt

async def test_local_model_connection() -> Dict[str, Any]:
    """Test connection to local AI model"""
    try:
        if not AI_INTEGRATION_ENABLED:
            return {"status": "disabled", "message": "AI integration is disabled"}
        
        # Test with a simple prompt
        test_response = await call_local_model("Hello, can you respond with 'AI model is working'?")
        
        if test_response:
            return {
                "status": "connected",
                "model": LOCAL_MODEL_NAME,
                "endpoint": LOCAL_MODEL_ENDPOINT,
                "test_response": test_response[:100] + "..." if len(test_response) > 100 else test_response
            }
        else:
            return {
                "status": "error",
                "message": "No response from AI model",
                "endpoint": LOCAL_MODEL_ENDPOINT
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "endpoint": LOCAL_MODEL_ENDPOINT
        }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )

@app.post("/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with the local AI model"""
    try:
        logger.info(f"Received chat request: {request.message[:100]}...")
        
        # Try local AI model first if enabled
        if AI_INTEGRATION_ENABLED:
            ai_response = await call_local_model(request.message, request.context)
            if ai_response:
                logger.info("Using local AI model response")
                return ChatResponse(
                    response=ai_response,
                    timestamp=datetime.now().isoformat()
                )
        
        # Fallback to internal analysis engine
        logger.info("Using internal analysis engine")
        response = await ai_model.generate_response(
            request.message, 
            request.context
        )
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/models")
async def list_models():
    """List available AI models"""
    models = []
    
    if AI_INTEGRATION_ENABLED:
        models.append({
            "id": "local",
            "name": f"Local AI Model ({LOCAL_MODEL_NAME})",
            "version": "1.0.0",
            "description": f"Local AI model running at {LOCAL_MODEL_ENDPOINT}",
            "endpoint": LOCAL_MODEL_ENDPOINT,
            "model_name": LOCAL_MODEL_NAME
        })
    
    models.append({
        "id": "internal",
        "name": "Internal Analysis Engine",
        "version": "1.0.0",
        "description": "Rule-based analysis engine for product tree management"
    })
    
    return {"models": models}

@app.get("/ai/test")
async def test_ai_connection():
    """Test connection to local AI model"""
    return await test_local_model_connection()

# Global product tree storage
current_product_tree = None

@app.post("/product-tree/import")
async def import_product_tree(tree_data: dict):
    """Import a product tree"""
    global current_product_tree
    current_product_tree = tree_data
    return {"success": True, "message": f"Imported {len(tree_data.get('nodes', []))} nodes"}

@app.get("/product-tree/debug")
async def debug_product_tree():
    """Debug endpoint to analyze product tree structure"""
    try:
        global current_product_tree
        if not current_product_tree:
            return {"error": "No product tree loaded"}
        
        nodes = current_product_tree.get('nodes', [])
        edges = current_product_tree.get('edges', [])
        
        # Build parent-child relationships
        children = {}
        parents = {}
        
        for edge in edges:
            from_id = edge.get('from')
            to_id = edge.get('to')
            
            if from_id not in children:
                children[from_id] = []
            children[from_id].append(to_id)
            
            if to_id not in parents:
                parents[to_id] = []
            parents[to_id].append(from_id)
        
        # Find root nodes
        root_nodes = [node['id'] for node in nodes if node['id'] not in parents]
        
        # Check for duplicates
        node_titles = {}
        duplicates = []
        for node in nodes:
            title = node.get('title', '')
            if title in node_titles:
                duplicates.append({
                    'title': title,
                    'nodes': [node_titles[title], node['id']]
                })
            else:
                node_titles[title] = node['id']
        
        # Check for circular references
        circular_refs = []
        for node in nodes:
            node_id = node['id']
            visited = set()
            stack = [node_id]
            while stack:
                current = stack.pop()
                if current in visited:
                    circular_refs.append(node_id)
                    break
                visited.add(current)
                stack.extend(children.get(current, []))
        
        return {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "root_nodes": root_nodes,
            "duplicates": duplicates,
            "circular_references": circular_refs,
            "node_titles": list(node_titles.keys()),
            "hierarchy_summary": {
                "nodes_with_children": len([n for n in children.values() if n]),
                "leaf_nodes": len([n for n in nodes if n['id'] not in children or not children[n['id']]])
            }
        }
        
    except Exception as e:
        logger.error(f"Error debugging product tree: {str(e)}")
        return {"error": str(e)}

@app.get("/product-tree/xml")
async def get_product_tree_xml():
    """Generate XML from the current product tree"""
    try:
        global current_product_tree
        if not current_product_tree:
            return {"error": "No product tree loaded"}
        
        # Build hierarchy for XML generation
        node_map = {node['id']: node for node in current_product_tree.get('nodes', [])}
        children = {}
        parents = {}
        
        # Initialize children dict
        for node_id in node_map.keys():
            children[node_id] = []
        
        # Process edges to build parent-child relationships
        for edge in current_product_tree.get('edges', []):
            from_id = edge.get('from')
            to_id = edge.get('to')
            
            if from_id in node_map and to_id in node_map:
                children[from_id].append(to_id)
                if to_id not in parents:
                    parents[to_id] = []
                parents[to_id].append(from_id)
        
        # Find root nodes (nodes with no parents)
        root_nodes = [node_id for node_id in node_map.keys() if node_id not in parents]
        
        def build_xml_node(node_id, depth=0):
            """Recursively build XML for a node and its children"""
            node = node_map[node_id]
            indent = '  ' * depth
            
            # Build attributes
            attrs = []
            if node.get('status'):
                attrs.append(f'status="{node["status"]}"')
            if node.get('priority'):
                attrs.append(f'priority="{node["priority"]}"')
            if node.get('team'):
                attrs.append(f'team="{node["team"]}"')
            if node.get('owner'):
                attrs.append(f'owner="{node["owner"]}"')
            if node.get('effort'):
                attrs.append(f'effort="{node["effort"]}"')
            
            attr_str = ' ' + ' '.join(attrs) if attrs else ''
            
            # Get children
            node_children = children.get(node_id, [])
            
            if node_children:
                # Node with children
                xml = f'{indent}<{node["type"]}{attr_str}>\n'
                xml += f'{indent}  <title>{node["title"]}</title>\n'
                if node.get('description'):
                    xml += f'{indent}  <description>{node["description"]}</description>\n'
                
                # Recursively add children
                for child_id in node_children:
                    xml += build_xml_node(child_id, depth + 1)
                
                xml += f'{indent}</{node["type"]}>\n'
            else:
                # Leaf node
                xml = f'{indent}<{node["type"]}{attr_str}>\n'
                xml += f'{indent}  <title>{node["title"]}</title>\n'
                if node.get('description'):
                    xml += f'{indent}  <description>{node["description"]}</description>\n'
                xml += f'{indent}</{node["type"]}>\n'
            
            return xml
        
        # Build the complete XML tree
        xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_content += '<product_tree>\n'
        
        for root_node_id in root_nodes:
            xml_content += build_xml_node(root_node_id, 1)
        
        xml_content += '</product_tree>'
        
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={"Content-Type": "application/xml; charset=utf-8"}
        )
        
    except Exception as e:
        logger.error(f"Error generating XML: {str(e)}")
        return {"error": str(e)}

# Product Tree CRUD Operations
@app.post("/product-tree/nodes")
async def create_node(request: NodeRequest):
    """Create a new node in the product tree"""
    try:
        # This would typically save to a database
        # For now, we'll return the created node structure
        node = {
            "id": request.node_id,
            "title": request.title,
            "type": request.type,
            "description": request.description,
            "status": request.status or "Not Started",
            "priority": request.priority or "Medium",
            "team": request.team,
            "owner": request.owner,
            "effort": request.effort,
            "parent_id": request.parent_id,
            "created_at": datetime.now().isoformat()
        }
        
        return {"success": True, "node": node}
        
    except Exception as e:
        logger.error(f"Error creating node: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/product-tree/nodes/{node_id}")
async def update_node(node_id: str, request: UpdateNodeRequest):
    """Update an existing node"""
    try:
        # This would typically update in a database
        # For now, we'll return the updated node structure
        updated_node = {
            "id": node_id,
            "updated_at": datetime.now().isoformat(),
            **request.updates
        }
        
        return {"success": True, "node": updated_node}
        
    except Exception as e:
        logger.error(f"Error updating node: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/product-tree/nodes/{node_id}")
async def delete_node(node_id: str):
    """Delete a node from the product tree"""
    try:
        # This would typically delete from a database
        return {"success": True, "message": f"Node {node_id} deleted"}
        
    except Exception as e:
        logger.error(f"Error deleting node: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/product-tree/nodes/{node_id}")
async def get_node(node_id: str):
    """Get details of a specific node"""
    try:
        # This would typically fetch from a database
        # For now, return a sample node
        node = {
            "id": node_id,
            "title": "Sample Node",
            "type": "Work Item",
            "description": "This is a sample node",
            "status": "In Progress",
            "priority": "High",
            "team": "Development Team",
            "owner": "John Doe",
            "effort": "5 days",
            "parent_id": None,
            "created_at": datetime.now().isoformat()
        }
        
        return {"success": True, "node": node}
        
    except Exception as e:
        logger.error(f"Error getting node: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
