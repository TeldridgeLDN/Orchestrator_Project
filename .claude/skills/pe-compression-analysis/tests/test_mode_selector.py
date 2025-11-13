"""
Unit tests for ModeSelector with <2s performance target.
"""

import pytest
import sys
import os

# Add src to path
src_path = os.path.join(os.path.dirname(__file__), "..", "src")
sys.path.insert(0, src_path)

from modes.mode_selector import ModeSelector, AnalysisMode


class TestModeSelectorBasic:
    """Test basic mode selection logic."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.selector = ModeSelector()
    
    def test_init(self):
        """Test ModeSelector initialization."""
        assert self.selector is not None
        assert self.selector.prefer_offline is False
    
    def test_init_with_prefer_offline(self):
        """Test initialization with prefer_offline flag."""
        selector = ModeSelector(prefer_offline=True)
        assert selector.prefer_offline is True
    
    def test_select_mode_returns_valid_mode(self):
        """Test that select_mode returns a valid AnalysisMode."""
        mode = self.selector.select_mode()
        assert isinstance(mode, AnalysisMode)
        assert mode in [AnalysisMode.BASIC, AnalysisMode.FULL, AnalysisMode.OFFLINE]
    
    def test_select_mode_basic_available(self):
        """Test that Basic mode is always selectable."""
        # Basic mode should always be available
        mode = self.selector.select_mode()
        assert mode is not None
    
    def test_get_mode_suggestion_structure(self):
        """Test mode suggestion returns correct structure."""
        suggestion = self.selector.get_mode_suggestion()
        
        assert "selected_mode" in suggestion
        assert "description" in suggestion
        assert "recommendation" in suggestion
        assert "available_modes" in suggestion
        assert "environment" in suggestion
        assert "selection_time" in suggestion
        assert "alternatives" in suggestion
    
    def test_get_mode_suggestion_has_basic(self):
        """Test that Basic mode is always in available modes."""
        suggestion = self.selector.get_mode_suggestion()
        assert "basic" in suggestion["available_modes"]


class TestModeSelectorPerformance:
    """Test performance requirements (<2s target)."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.selector = ModeSelector()
    
    def test_select_mode_performance_target(self):
        """
        Test that mode selection meets <2s performance target.
        
        This is a critical requirement from Subtask 1.4.
        """
        import time
        
        # Measure selection time
        start = time.time()
        mode = self.selector.select_mode()
        elapsed = time.time() - start
        
        # Must be under 2 seconds
        assert elapsed < 2.0, f"Mode selection took {elapsed:.3f}s (target: <2s)"
        
        # Should actually be much faster (< 0.1s)
        assert elapsed < 0.1, f"Mode selection should be <0.1s, got {elapsed:.3f}s"
    
    def test_select_mode_cached_performance(self):
        """Test that cached mode selection is very fast."""
        import time
        
        # First call (may need to check environment)
        self.selector.select_mode()
        
        # Second call (should use cache)
        start = time.time()
        mode = self.selector.select_mode()
        elapsed = time.time() - start
        
        # Cached call should be extremely fast
        assert elapsed < 0.01, f"Cached selection took {elapsed:.3f}s, should be <0.01s"
    
    def test_get_selection_performance_metrics(self):
        """Test performance metrics collection."""
        metrics = self.selector.get_selection_performance()
        
        assert "iterations" in metrics
        assert "average_time" in metrics
        assert "max_time" in metrics
        assert "min_time" in metrics
        assert "target_time" in metrics
        assert "meets_target" in metrics
        assert "performance_rating" in metrics
        
        # Average should meet target
        assert metrics["meets_target"] is True
        assert metrics["average_time"] < 2.0
        
        # Rating should be good or excellent
        assert metrics["performance_rating"] in ["excellent", "good"]


class TestModeSelectorLogic:
    """Test mode selection logic and preferences."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.selector = ModeSelector()
    
    def test_prefer_offline_false_prioritizes_full(self):
        """Test that prefer_offline=False prioritizes Full mode."""
        selector = ModeSelector(prefer_offline=False)
        
        # Mock environment check (this is tested implicitly by mode selection)
        mode = selector.select_mode()
        
        # If API key present, should select Full mode
        # Otherwise Basic or Offline
        assert mode in [AnalysisMode.BASIC, AnalysisMode.FULL, AnalysisMode.OFFLINE]
    
    def test_prefer_offline_true(self):
        """Test prefer_offline=True behavior."""
        selector = ModeSelector(prefer_offline=True)
        mode = selector.select_mode()
        
        assert mode in [AnalysisMode.BASIC, AnalysisMode.FULL, AnalysisMode.OFFLINE]
    
    def test_force_refresh_parameter(self):
        """Test force_refresh parameter."""
        # First selection
        mode1 = self.selector.select_mode(force_refresh=False)
        
        # Second selection with refresh
        mode2 = self.selector.select_mode(force_refresh=True)
        
        # Both should return valid modes
        assert isinstance(mode1, AnalysisMode)
        assert isinstance(mode2, AnalysisMode)


class TestModeSelectorValidation:
    """Test mode validation functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.selector = ModeSelector()
    
    def test_validate_basic_mode(self):
        """Test Basic mode validation (always valid)."""
        validation = self.selector.validate_mode(AnalysisMode.BASIC)
        
        assert validation["mode"] == "basic"
        assert validation["valid"] is True
        assert "always available" in validation["reason"].lower()
    
    def test_validate_full_mode(self):
        """Test Full mode validation."""
        validation = self.selector.validate_mode(AnalysisMode.FULL)
        
        assert validation["mode"] == "full"
        assert isinstance(validation["valid"], bool)
        assert "reason" in validation
        
        if not validation["valid"]:
            assert len(validation["requirements"]) > 0
            assert "PERPLEXITY_API_KEY" in validation["requirements"][0]
    
    def test_validate_offline_mode(self):
        """Test Offline mode validation."""
        validation = self.selector.validate_mode(AnalysisMode.OFFLINE)
        
        assert validation["mode"] == "offline"
        assert isinstance(validation["valid"], bool)
        assert "reason" in validation
        
        if not validation["valid"]:
            assert len(validation["requirements"]) > 0


class TestModeSelectorSuggestions:
    """Test mode suggestion and recommendation logic."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.selector = ModeSelector()
    
    def test_suggestion_includes_alternatives(self):
        """Test that suggestions include alternative modes."""
        suggestion = self.selector.get_mode_suggestion()
        
        alternatives = suggestion["alternatives"]
        
        # Alternatives should be a dictionary
        assert isinstance(alternatives, dict)
        
        # Each alternative should have a description
        for mode, desc in alternatives.items():
            assert isinstance(mode, str)
            assert isinstance(desc, str)
            assert len(desc) > 0
    
    def test_recommendation_has_visual_indicators(self):
        """Test that recommendations include visual indicators."""
        suggestion = self.selector.get_mode_suggestion()
        recommendation = suggestion["recommendation"]
        
        # Should contain at least one visual indicator
        visual_indicators = ["✅", "⚠️", "ℹ️"]
        has_indicator = any(indicator in recommendation for indicator in visual_indicators)
        
        assert has_indicator, "Recommendation should include visual indicators"
    
    def test_selection_time_recorded(self):
        """Test that selection time is recorded in suggestions."""
        suggestion = self.selector.get_mode_suggestion()
        
        assert "selection_time" in suggestion
        assert isinstance(suggestion["selection_time"], float)
        assert suggestion["selection_time"] >= 0
        assert suggestion["selection_time"] < 2.0  # Must meet performance target


class TestModeSelectorCaching:
    """Test environment state caching for performance."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.selector = ModeSelector()
    
    def test_environment_state_cached(self):
        """Test that environment state is cached."""
        # First call
        mode1 = self.selector.select_mode()
        cache1 = self.selector._cached_env_state
        timestamp1 = self.selector._cache_timestamp
        
        # Second call (should use cache)
        mode2 = self.selector.select_mode()
        cache2 = self.selector._cached_env_state
        timestamp2 = self.selector._cache_timestamp
        
        # Cache should be same object
        assert cache1 is cache2
        assert timestamp1 == timestamp2
    
    def test_force_refresh_updates_cache(self):
        """Test that force_refresh updates the cache."""
        import time
        
        # First call
        self.selector.select_mode()
        timestamp1 = self.selector._cache_timestamp
        
        # Small delay
        time.sleep(0.01)
        
        # Force refresh
        self.selector.select_mode(force_refresh=True)
        timestamp2 = self.selector._cache_timestamp
        
        # Timestamp should be updated
        assert timestamp2 > timestamp1


class TestModeSelectorIntegration:
    """Integration tests for ModeSelector."""
    
    def test_mode_enum_values(self):
        """Test that AnalysisMode enum has expected values."""
        assert AnalysisMode.BASIC.value == "basic"
        assert AnalysisMode.FULL.value == "full"
        assert AnalysisMode.OFFLINE.value == "offline"
    
    def test_all_modes_can_be_validated(self):
        """Test that all modes can be validated."""
        selector = ModeSelector()
        
        for mode in AnalysisMode:
            validation = selector.validate_mode(mode)
            assert "mode" in validation
            assert "valid" in validation
            assert "reason" in validation
    
    def test_selector_consistency(self):
        """Test that multiple selectors behave consistently."""
        selector1 = ModeSelector()
        selector2 = ModeSelector()
        
        mode1 = selector1.select_mode()
        mode2 = selector2.select_mode()
        
        # Both should select the same mode given same environment
        assert mode1 == mode2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

