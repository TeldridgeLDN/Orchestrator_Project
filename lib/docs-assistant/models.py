"""
Documentation Assistant Data Models

Core data structures for context, suggestions, and learning.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, List, Optional
import hashlib
import json


class ContextType(Enum):
    """Type of context detected."""
    FILE = "file"
    TASK = "task"
    ERROR = "error"
    GIT_BRANCH = "git_branch"
    COMMAND = "command"
    CODE_SYMBOL = "code_symbol"


class SuggestionType(Enum):
    """Type of documentation suggestion."""
    API_DOC = "api_doc"
    CODE_EXAMPLE = "code_example"
    ERROR_SOLUTION = "error_solution"
    BEST_PRACTICE = "best_practice"
    TUTORIAL = "tutorial"


@dataclass
class Context:
    """Development context information."""
    type: ContextType
    value: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'type': self.type.value,
            'value': self.value,
            'metadata': self.metadata,
            'timestamp': self.timestamp.isoformat()
        }
    
    def compute_hash(self) -> str:
        """Compute context fingerprint."""
        canonical = {
            'type': self.type.value,
            'value': self.value
        }
        canonical_str = json.dumps(canonical, sort_keys=True)
        return hashlib.sha256(canonical_str.encode()).hexdigest()[:16]


@dataclass
class Suggestion:
    """Documentation suggestion."""
    id: str
    type: SuggestionType
    title: str
    content: str
    source: str  # Documentation source
    relevance_score: float  # 0.0 to 1.0
    
    # Optional fields
    code_examples: List[str] = field(default_factory=list)
    related_links: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'type': self.type.value,
            'title': self.title,
            'content': self.content,
            'source': self.source,
            'relevance_score': self.relevance_score,
            'code_examples': self.code_examples,
            'related_links': self.related_links,
            'tags': self.tags,
            'metadata': self.metadata
        }


@dataclass
class SuggestionResult:
    """Result of suggestion query."""
    query: str
    contexts: List[Context]
    suggestions: List[Suggestion]
    response_time_ms: float
    confidence: float  # 0.0 to 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'query': self.query,
            'contexts': [c.to_dict() for c in self.contexts],
            'suggestions': [s.to_dict() for s in self.suggestions],
            'response_time_ms': self.response_time_ms,
            'confidence': self.confidence
        }


@dataclass
class Feedback:
    """User feedback on suggestion."""
    suggestion_id: str
    context_hash: str
    accepted: bool
    helpful: Optional[bool] = None
    comment: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'suggestion_id': self.suggestion_id,
            'context_hash': self.context_hash,
            'accepted': self.accepted,
            'helpful': self.helpful,
            'comment': self.comment,
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class UsageStats:
    """Usage statistics."""
    total_queries: int = 0
    total_suggestions: int = 0
    accepted_suggestions: int = 0
    rejected_suggestions: int = 0
    avg_response_time_ms: float = 0.0
    avg_relevance_score: float = 0.0
    
    @property
    def acceptance_rate(self) -> float:
        """Calculate acceptance rate."""
        total = self.accepted_suggestions + self.rejected_suggestions
        return self.accepted_suggestions / total if total > 0 else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'total_queries': self.total_queries,
            'total_suggestions': self.total_suggestions,
            'accepted_suggestions': self.accepted_suggestions,
            'rejected_suggestions': self.rejected_suggestions,
            'acceptance_rate': self.acceptance_rate,
            'avg_response_time_ms': self.avg_response_time_ms,
            'avg_relevance_score': self.avg_relevance_score
        }

