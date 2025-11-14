"""
Documentation Assistant Core Engine

Main orchestration for context-aware documentation suggestions.
"""

import logging
from typing import List, Optional
from datetime import datetime
import time

from .models import Context, Suggestion, SuggestionResult, Feedback, UsageStats
from .context_analyzer import ContextAnalyzer
from .suggestion_engine import SuggestionEngine
from .learning import LearningModule
from .storage import UsageStorage

logger = logging.getLogger(__name__)


class DocumentationAssistant:
    """
    Context-aware documentation assistant.
    
    Features:
    - Intelligent context detection
    - ML-powered suggestion ranking
    - Learning from user feedback
    - <200ms response time
    - Offline support
    """
    
    def __init__(
        self,
        index_path: Optional[str] = None,
        storage_path: Optional[str] = None,
        offline_mode: bool = False
    ):
        """
        Initialize documentation assistant.
        
        Args:
            index_path: Path to documentation index
            storage_path: Path to SQLite database
            offline_mode: Enable offline operation
        """
        self.context_analyzer = ContextAnalyzer()
        self.suggestion_engine = SuggestionEngine(index_path)
        self.learning_module = LearningModule()
        self.storage = UsageStorage(storage_path)
        
        self.offline_mode = offline_mode
        self.stats = UsageStats()
        
        logger.info("DocumentationAssistant initialized")
    
    def suggest(
        self,
        query: str,
        contexts: Optional[List[Context]] = None,
        max_suggestions: int = 5
    ) -> SuggestionResult:
        """
        Get documentation suggestions.
        
        Args:
            query: User query or search term
            contexts: Additional context (auto-detected if None)
            max_suggestions: Maximum suggestions to return
        
        Returns:
            Suggestion result
        """
        start_time = time.time()
        
        # Detect context if not provided
        if contexts is None:
            contexts = self.context_analyzer.analyze()
        
        # Get suggestions from engine
        suggestions = self.suggestion_engine.suggest(
            query=query,
            contexts=contexts,
            max_results=max_suggestions
        )
        
        # Apply learning adjustments
        suggestions = self.learning_module.adjust_rankings(
            suggestions,
            contexts
        )
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Calculate confidence
        confidence = self._calculate_confidence(suggestions)
        
        # Create result
        result = SuggestionResult(
            query=query,
            contexts=contexts,
            suggestions=suggestions,
            response_time_ms=response_time_ms,
            confidence=confidence
        )
        
        # Log usage
        self._log_usage(result)
        
        # Store in database
        self.storage.log_query(query, contexts, suggestions, response_time_ms)
        
        logger.info(f"Generated {len(suggestions)} suggestions in {response_time_ms:.1f}ms")
        
        return result
    
    def provide_feedback(
        self,
        suggestion_id: str,
        context_hash: str,
        accepted: bool,
        helpful: Optional[bool] = None,
        comment: Optional[str] = None
    ):
        """
        Provide feedback on suggestion.
        
        Args:
            suggestion_id: Suggestion ID
            context_hash: Context hash
            accepted: Whether suggestion was accepted
            helpful: Whether suggestion was helpful
            comment: Optional comment
        """
        feedback = Feedback(
            suggestion_id=suggestion_id,
            context_hash=context_hash,
            accepted=accepted,
            helpful=helpful,
            comment=comment
        )
        
        # Update learning module
        self.learning_module.record_feedback(feedback)
        
        # Store in database
        self.storage.log_feedback(feedback)
        
        # Update stats
        if accepted:
            self.stats.accepted_suggestions += 1
        else:
            self.stats.rejected_suggestions += 1
        
        logger.info(f"Recorded feedback for suggestion {suggestion_id}: accepted={accepted}")
    
    def get_stats(self) -> UsageStats:
        """Get usage statistics."""
        return self.stats
    
    def _calculate_confidence(self, suggestions: List[Suggestion]) -> float:
        """Calculate overall confidence score."""
        if not suggestions:
            return 0.0
        
        # Average of top 3 relevance scores
        top_scores = sorted([s.relevance_score for s in suggestions], reverse=True)[:3]
        return sum(top_scores) / len(top_scores)
    
    def _log_usage(self, result: SuggestionResult):
        """Update usage statistics."""
        self.stats.total_queries += 1
        self.stats.total_suggestions += len(result.suggestions)
        
        # Update rolling average response time
        n = self.stats.total_queries
        self.stats.avg_response_time_ms = (
            (self.stats.avg_response_time_ms * (n - 1) + result.response_time_ms) / n
        )
        
        # Update rolling average relevance
        if result.suggestions:
            avg_relevance = sum(s.relevance_score for s in result.suggestions) / len(result.suggestions)
            self.stats.avg_relevance_score = (
                (self.stats.avg_relevance_score * (n - 1) + avg_relevance) / n
            )

