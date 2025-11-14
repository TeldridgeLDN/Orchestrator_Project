"""
Learning Module

Learns from user feedback to improve suggestion quality.
"""

import logging
from typing import List, Dict
from collections import defaultdict

from .models import Suggestion, Context, Feedback

logger = logging.getLogger(__name__)


class LearningModule:
    """
    ML-based learning from user feedback.
    
    Features:
    - Tracks suggestion acceptance rates
    - Learns context-suggestion patterns
    - Adjusts relevance scores
    - Identifies high-value suggestions
    """
    
    def __init__(self):
        """Initialize learning module."""
        # Track feedback per context-suggestion pair
        self.feedback_history: Dict[str, List[Feedback]] = defaultdict(list)
        
        # Track overall suggestion performance
        self.suggestion_stats: Dict[str, Dict] = defaultdict(lambda: {
            'shown': 0,
            'accepted': 0,
            'rejected': 0,
            'helpful': 0,
            'unhelpful': 0
        })
        
        # Track context patterns
        self.context_patterns: Dict[str, List[str]] = defaultdict(list)
    
    def record_feedback(self, feedback: Feedback):
        """
        Record user feedback.
        
        Args:
            feedback: User feedback
        """
        # Store feedback
        key = f"{feedback.context_hash}_{feedback.suggestion_id}"
        self.feedback_history[key].append(feedback)
        
        # Update suggestion stats
        stats = self.suggestion_stats[feedback.suggestion_id]
        if feedback.accepted:
            stats['accepted'] += 1
        else:
            stats['rejected'] += 1
        
        if feedback.helpful is not None:
            if feedback.helpful:
                stats['helpful'] += 1
            else:
                stats['unhelpful'] += 1
        
        logger.debug(f"Recorded feedback for suggestion {feedback.suggestion_id}")
    
    def adjust_rankings(
        self,
        suggestions: List[Suggestion],
        contexts: List[Context]
    ) -> List[Suggestion]:
        """
        Adjust suggestion rankings based on learned patterns.
        
        Args:
            suggestions: Original suggestions
            contexts: Current contexts
        
        Returns:
            Re-ranked suggestions
        """
        if not suggestions:
            return suggestions
        
        # Calculate context hash
        context_hash = self._hash_contexts(contexts)
        
        # Adjust scores based on historical performance
        for suggestion in suggestions:
            # Get stats for this suggestion
            stats = self.suggestion_stats.get(suggestion.id, {})
            
            if stats:
                # Calculate acceptance rate
                total = stats.get('accepted', 0) + stats.get('rejected', 0)
                if total > 0:
                    acceptance_rate = stats['accepted'] / total
                    
                    # Boost or penalize based on acceptance
                    adjustment = (acceptance_rate - 0.5) * 0.2  # ±10% max
                    suggestion.relevance_score = min(1.0, max(0.0, 
                        suggestion.relevance_score + adjustment
                    ))
            
            # Check for context-specific patterns
            key = f"{context_hash}_{suggestion.id}"
            if key in self.feedback_history:
                history = self.feedback_history[key]
                accepted_count = sum(1 for f in history if f.accepted)
                
                # Strong boost for previously accepted in this context
                if accepted_count > 0:
                    suggestion.relevance_score = min(1.0, 
                        suggestion.relevance_score + 0.15
                    )
        
        # Re-sort by adjusted scores
        suggestions.sort(key=lambda s: s.relevance_score, reverse=True)
        
        return suggestions
    
    def get_suggestion_performance(self, suggestion_id: str) -> Dict:
        """
        Get performance metrics for a suggestion.
        
        Args:
            suggestion_id: Suggestion ID
        
        Returns:
            Performance metrics
        """
        stats = self.suggestion_stats.get(suggestion_id, {})
        
        total = stats.get('accepted', 0) + stats.get('rejected', 0)
        acceptance_rate = stats['accepted'] / total if total > 0 else 0.0
        
        return {
            'shown': stats.get('shown', 0),
            'accepted': stats.get('accepted', 0),
            'rejected': stats.get('rejected', 0),
            'acceptance_rate': acceptance_rate
        }
    
    def _hash_contexts(self, contexts: List[Context]) -> str:
        """Create hash from contexts."""
        if not contexts:
            return "no_context"
        
        # Simple hash: concatenate context hashes
        hashes = [ctx.compute_hash() for ctx in contexts]
        return "_".join(sorted(hashes))

