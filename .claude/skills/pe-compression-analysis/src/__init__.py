"""
P/E Compression Analysis Skill

This package provides automated P/E compression analysis with intelligent
mode selection, robust keyword activation, and seamless workflow integration.

Modules:
    - core: Main analysis logic and orchestration
    - nlp: spaCy-based keyword detection
    - modes: Operational mode implementations (Basic, Full, Offline)
    - integration: Workflow 9 integration interface
    - utils: Utility functions and helpers
"""

__version__ = "0.1.0"
__author__ = "Momentum Squared"

from .core import PECompressionAnalyzer
from .nlp import KeywordDetector
from .modes import ModeSelector, AnalysisMode

__all__ = [
    "PECompressionAnalyzer",
    "KeywordDetector",
    "ModeSelector",
    "AnalysisMode",
]

