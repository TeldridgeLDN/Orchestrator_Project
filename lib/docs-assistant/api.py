"""
API Integration

RESTful API endpoints for suggestion retrieval and external integrations.
"""

import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class APIIntegration:
    """
    REST API interface for documentation assistant.
    
    Provides:
    - Suggestion endpoints
    - Feedback endpoints
    - Stats endpoints
    - Webhook integration
    """
    
    def __init__(self, assistant):
        """
        Initialize API integration.
        
        Args:
            assistant: DocumentationAssistant instance
        """
        self.assistant = assistant
    
    def handle_suggest_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle suggestion API request.
        
        Args:
            request_data: Request payload {
                "query": str,
                "contexts": List[Dict],
                "max_results": int
            }
        
        Returns:
            Response payload
        """
        try:
            query = request_data.get('query', '')
            contexts = self._parse_contexts(request_data.get('contexts', []))
            max_results = request_data.get('max_results', 5)
            
            # Get suggestions
            result = self.assistant.suggest(query, contexts, max_results)
            
            return {
                'success': True,
                'data': result.to_dict()
            }
        
        except Exception as e:
            logger.error(f"Suggestion API error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_feedback_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle feedback API request.
        
        Args:
            request_data: Request payload {
                "suggestion_id": str,
                "context_hash": str,
                "accepted": bool,
                "helpful": bool (optional),
                "comment": str (optional)
            }
        
        Returns:
            Response payload
        """
        try:
            self.assistant.provide_feedback(
                suggestion_id=request_data['suggestion_id'],
                context_hash=request_data['context_hash'],
                accepted=request_data['accepted'],
                helpful=request_data.get('helpful'),
                comment=request_data.get('comment')
            )
            
            return {'success': True}
        
        except Exception as e:
            logger.error(f"Feedback API error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_stats_request(self) -> Dict[str, Any]:
        """
        Handle stats API request.
        
        Returns:
            Response payload with statistics
        """
        try:
            stats = self.assistant.get_stats()
            
            return {
                'success': True,
                'data': stats.to_dict()
            }
        
        except Exception as e:
            logger.error(f"Stats API error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _parse_contexts(self, contexts_data: List[Dict]) -> List:
        """Parse context data from API request."""
        from .models import Context, ContextType
        
        contexts = []
        for ctx_data in contexts_data:
            try:
                ctx = Context(
                    type=ContextType(ctx_data['type']),
                    value=ctx_data['value'],
                    metadata=ctx_data.get('metadata', {})
                )
                contexts.append(ctx)
            except Exception as e:
                logger.warning(f"Could not parse context: {e}")
        
        return contexts


# Flask app example (optional)
def create_flask_app(assistant):
    """
    Create Flask API server (requires flask package).
    
    Args:
        assistant: DocumentationAssistant instance
    
    Returns:
        Flask app
    """
    try:
        from flask import Flask, request, jsonify
        
        app = Flask(__name__)
        api = APIIntegration(assistant)
        
        @app.route('/api/suggest', methods=['POST'])
        def suggest():
            """Suggestion endpoint."""
            return jsonify(api.handle_suggest_request(request.json))
        
        @app.route('/api/feedback', methods=['POST'])
        def feedback():
            """Feedback endpoint."""
            return jsonify(api.handle_feedback_request(request.json))
        
        @app.route('/api/stats', methods=['GET'])
        def stats():
            """Statistics endpoint."""
            return jsonify(api.handle_stats_request())
        
        @app.route('/health', methods=['GET'])
        def health():
            """Health check endpoint."""
            return jsonify({'status': 'healthy'})
        
        return app
    
    except ImportError:
        logger.warning("Flask not available, API server cannot be created")
        return None


# FastAPI app example (optional)
def create_fastapi_app(assistant):
    """
    Create FastAPI server (requires fastapi package).
    
    Args:
        assistant: DocumentationAssistant instance
    
    Returns:
        FastAPI app
    """
    try:
        from fastapi import FastAPI, HTTPException
        from pydantic import BaseModel
        
        app = FastAPI(title="Documentation Assistant API")
        api = APIIntegration(assistant)
        
        class SuggestRequest(BaseModel):
            query: str
            contexts: List[Dict] = []
            max_results: int = 5
        
        class FeedbackRequest(BaseModel):
            suggestion_id: str
            context_hash: str
            accepted: bool
            helpful: Optional[bool] = None
            comment: Optional[str] = None
        
        @app.post("/api/suggest")
        async def suggest(request: SuggestRequest):
            """Get documentation suggestions."""
            result = api.handle_suggest_request(request.dict())
            if not result['success']:
                raise HTTPException(status_code=500, detail=result['error'])
            return result
        
        @app.post("/api/feedback")
        async def feedback(request: FeedbackRequest):
            """Submit feedback."""
            result = api.handle_feedback_request(request.dict())
            if not result['success']:
                raise HTTPException(status_code=500, detail=result['error'])
            return result
        
        @app.get("/api/stats")
        async def stats():
            """Get statistics."""
            result = api.handle_stats_request()
            if not result['success']:
                raise HTTPException(status_code=500, detail=result['error'])
            return result
        
        @app.get("/health")
        async def health():
            """Health check."""
            return {"status": "healthy"}
        
        return app
    
    except ImportError:
        logger.warning("FastAPI not available, API server cannot be created")
        return None

