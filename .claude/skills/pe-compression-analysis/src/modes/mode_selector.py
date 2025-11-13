"""
Mode selection logic for P/E Compression Analysis.

This module determines the optimal operational mode based on
environment state and available resources.
"""

from enum import Enum
from typing import Dict, Any
import os
import sys

# Handle imports for both package and direct usage
try:
    from ..utils import check_api_key, get_environment_state
except (ImportError, ValueError):
    # Fallback for direct execution or testing
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    from utils import check_api_key, get_environment_state


class AnalysisMode(Enum):
    """Operational modes for P/E Compression Analysis."""
    BASIC = "basic"
    FULL = "full"
    OFFLINE = "offline"


class ModeSelector:
    """
    Selects the optimal operational mode based on environment.
    
    Selection criteria:
    - Full mode: PERPLEXITY_API_KEY present and valid
    - Offline mode: Cache available, no API key
    - Basic mode: Fallback when other modes unavailable
    
    Performance target: <2s mode selection time
    """
    
    def __init__(self, prefer_offline: bool = False):
        """
        Initialize the mode selector.
        
        Args:
            prefer_offline: If True, prefer Offline mode over Full mode when both available
        """
        self.prefer_offline = prefer_offline
        self._cached_env_state = None
        self._cache_timestamp = None
    
    def select_mode(self, force_refresh: bool = False) -> AnalysisMode:
        """
        Automatically select the optimal operational mode.
        
        Uses cached environment state for performance (<2s target).
        
        Args:
            force_refresh: Force refresh of environment state (default: False)
        
        Returns:
            Selected AnalysisMode enum value
        """
        import time
        start_time = time.time()
        
        env_state = self._get_env_state(force_refresh)
        
        # Selection logic
        has_api_key = env_state.get("has_perplexity_key", False)
        has_cache = env_state.get("has_cache", False)
        
        selected_mode = None
        
        if self.prefer_offline:
            # Prefer offline when both available
            if has_cache:
                selected_mode = AnalysisMode.OFFLINE
            elif has_api_key:
                selected_mode = AnalysisMode.FULL
            else:
                selected_mode = AnalysisMode.BASIC
        else:
            # Prefer full mode (default)
            if has_api_key:
                selected_mode = AnalysisMode.FULL
            elif has_cache:
                selected_mode = AnalysisMode.OFFLINE
            else:
                selected_mode = AnalysisMode.BASIC
        
        # Verify performance target
        elapsed = time.time() - start_time
        if elapsed > 2.0:
            print(f"Warning: Mode selection took {elapsed:.2f}s (target: <2s)")
        
        return selected_mode
    
    def get_mode_suggestion(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get comprehensive mode selection suggestion with reasoning.
        
        Args:
            force_refresh: Force refresh of environment state
        
        Returns:
            Dictionary with selected mode, reasoning, and alternatives
        """
        import time
        start_time = time.time()
        
        selected_mode = self.select_mode(force_refresh)
        env_state = self._get_env_state(force_refresh)
        
        # Mode descriptions
        mode_descriptions = {
            AnalysisMode.FULL: "Full mode with Perplexity API integration for real-time data",
            AnalysisMode.OFFLINE: "Offline mode using cached historical data",
            AnalysisMode.BASIC: "Basic mode with built-in analysis logic"
        }
        
        # Get all available modes
        available_modes = self._get_available_modes(env_state)
        
        # Build suggestion
        suggestion = {
            "selected_mode": selected_mode.value,
            "description": mode_descriptions[selected_mode],
            "recommendation": self._get_recommendation(selected_mode, env_state),
            "available_modes": [mode.value for mode in available_modes],
            "environment": env_state,
            "selection_time": time.time() - start_time,
            "alternatives": self._get_alternatives(selected_mode, available_modes)
        }
        
        return suggestion
    
    def _get_env_state(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get environment state with caching for performance.
        
        Args:
            force_refresh: Force refresh of cached state
        
        Returns:
            Environment state dictionary
        """
        import time
        
        # Use cache if available and not forcing refresh
        if not force_refresh and self._cached_env_state is not None:
            # Cache valid for 60 seconds
            if self._cache_timestamp and (time.time() - self._cache_timestamp) < 60:
                return self._cached_env_state
        
        # Refresh cache
        self._cached_env_state = get_environment_state()
        self._cache_timestamp = time.time()
        
        return self._cached_env_state
    
    def _get_available_modes(self, env_state: Dict[str, Any]) -> list[AnalysisMode]:
        """
        Get list of available modes based on environment.
        
        Args:
            env_state: Current environment state
        
        Returns:
            List of available AnalysisMode enum values
        """
        available = [AnalysisMode.BASIC]  # Always available
        
        if env_state.get("has_perplexity_key", False):
            available.append(AnalysisMode.FULL)
        
        if env_state.get("has_cache", False):
            available.append(AnalysisMode.OFFLINE)
        
        return available
    
    def _get_recommendation(
        self,
        mode: AnalysisMode,
        env_state: Dict[str, Any]
    ) -> str:
        """
        Generate user-facing recommendation based on mode selection.
        
        Args:
            mode: Selected mode
            env_state: Current environment state
        
        Returns:
            Recommendation string with visual indicators
        """
        has_api_key = env_state.get("has_perplexity_key", False)
        has_cache = env_state.get("has_cache", False)
        
        if mode == AnalysisMode.FULL:
            return "✅ Using Full mode with live data from Perplexity API"
        
        if mode == AnalysisMode.OFFLINE:
            if not has_api_key:
                return "⚠️  Using Offline mode (cached data) - Set PERPLEXITY_API_KEY for live data"
            else:
                return "ℹ️  Using Offline mode (prefer_offline=True) - Switch to Full mode for real-time data"
        
        # Basic mode
        recommendations = []
        
        if not has_api_key and not has_cache:
            recommendations.append("ℹ️  Using Basic mode (no API key or cache)")
            recommendations.append("   • Set PERPLEXITY_API_KEY for enhanced analysis")
            recommendations.append("   • Or create cache for offline capability")
        elif not has_api_key:
            recommendations.append("ℹ️  Using Basic mode (no API key)")
            recommendations.append("   • Set PERPLEXITY_API_KEY for real-time data")
        elif not has_cache:
            recommendations.append("ℹ️  Using Basic mode (API error or offline preference)")
        else:
            recommendations.append("ℹ️  Using Basic mode")
        
        return "\n".join(recommendations)
    
    def _get_alternatives(
        self,
        selected_mode: AnalysisMode,
        available_modes: list[AnalysisMode]
    ) -> Dict[str, str]:
        """
        Get alternative mode recommendations.
        
        Args:
            selected_mode: Currently selected mode
            available_modes: List of available modes
        
        Returns:
            Dictionary of alternative modes with descriptions
        """
        alternatives = {}
        
        for mode in available_modes:
            if mode != selected_mode:
                if mode == AnalysisMode.FULL:
                    alternatives[mode.value] = "Switch to Full mode for real-time API data"
                elif mode == AnalysisMode.OFFLINE:
                    alternatives[mode.value] = "Switch to Offline mode for cached data"
                elif mode == AnalysisMode.BASIC:
                    alternatives[mode.value] = "Switch to Basic mode for simple analysis"
        
        return alternatives
    
    def validate_mode(self, mode: AnalysisMode) -> Dict[str, Any]:
        """
        Validate if a specific mode can be used.
        
        Args:
            mode: Mode to validate
        
        Returns:
            Validation result dictionary
        """
        env_state = self._get_env_state()
        
        validation = {
            "mode": mode.value,
            "valid": False,
            "reason": "",
            "requirements": []
        }
        
        if mode == AnalysisMode.BASIC:
            validation["valid"] = True
            validation["reason"] = "Basic mode always available"
        
        elif mode == AnalysisMode.FULL:
            if env_state.get("has_perplexity_key", False):
                validation["valid"] = True
                validation["reason"] = "API key available"
            else:
                validation["reason"] = "PERPLEXITY_API_KEY not found"
                validation["requirements"].append("Set PERPLEXITY_API_KEY environment variable")
        
        elif mode == AnalysisMode.OFFLINE:
            if env_state.get("has_cache", False):
                validation["valid"] = True
                validation["reason"] = "Cache available"
            else:
                validation["reason"] = "No cache found"
                validation["requirements"].append("Create cache file at cache/pe_data.json")
        
        return validation
    
    def get_selection_performance(self) -> Dict[str, Any]:
        """
        Get performance metrics for mode selection.
        
        Returns:
            Performance metrics dictionary
        """
        import time
        
        iterations = 100
        times = []
        
        for _ in range(iterations):
            start = time.time()
            self.select_mode(force_refresh=False)
            elapsed = time.time() - start
            times.append(elapsed)
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        min_time = min(times)
        
        return {
            "iterations": iterations,
            "average_time": avg_time,
            "max_time": max_time,
            "min_time": min_time,
            "target_time": 2.0,
            "meets_target": avg_time < 2.0,
            "performance_rating": "excellent" if avg_time < 0.1 else "good" if avg_time < 1.0 else "acceptable" if avg_time < 2.0 else "needs_improvement"
        }

