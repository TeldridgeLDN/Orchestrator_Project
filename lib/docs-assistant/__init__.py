"""
Documentation Assistant

Context-aware documentation suggestions with ML-powered ranking.
"""

from .assistant import DocumentationAssistant
from .models import (
    Context,
    ContextType,
    Suggestion,
    SuggestionType,
    SuggestionResult,
    Feedback,
    UsageStats
)
from .context_analyzer import ContextAnalyzer
from .suggestion_engine import SuggestionEngine
from .error_parser import ErrorParser, ParsedError
from .learning import LearningModule
from .storage import UsageStorage
from .indexer import DocumentationIndexer
from .cache import OfflineCache

__version__ = '1.0.0'

__all__ = [
    'DocumentationAssistant',
    'Context',
    'ContextType',
    'Suggestion',
    'SuggestionType',
    'SuggestionResult',
    'Feedback',
    'UsageStats',
    'ContextAnalyzer',
    'SuggestionEngine',
    'ErrorParser',
    'ParsedError',
    'LearningModule',
    'UsageStorage',
    'DocumentationIndexer',
    'OfflineCache'
]

