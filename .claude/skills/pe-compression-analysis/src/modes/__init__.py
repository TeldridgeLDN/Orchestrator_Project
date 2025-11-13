"""
Operational mode implementations and mode selection logic.

This module provides three operational modes:
    - Basic: No external API required
    - Full: Integrated with Perplexity API
    - Offline: Uses cached data only

The ModeSelector automatically chooses the optimal mode based on environment.
"""

from .mode_selector import ModeSelector, AnalysisMode
from .basic_mode import BasicMode
from .full_mode import FullMode
from .offline_mode import OfflineMode

__all__ = [
    "ModeSelector",
    "AnalysisMode",
    "BasicMode",
    "FullMode",
    "OfflineMode",
]

