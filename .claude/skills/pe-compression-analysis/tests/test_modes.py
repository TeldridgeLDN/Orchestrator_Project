"""
Unit tests for operational modes (Basic, Full, Offline).
"""

import pytest
import sys
import os

# Add src to path
src_path = os.path.join(os.path.dirname(__file__), "..", "src")
sys.path.insert(0, src_path)

from modes.basic_mode import BasicMode
from modes.full_mode import FullMode
from modes.offline_mode import OfflineMode
from modes.mode_selector import AnalysisMode


class TestBasicMode:
    """Test Basic mode operational logic."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.mode = BasicMode()
    
    def test_init(self):
        """Test Basic mode initialization."""
        assert self.mode is not None
        assert self.mode.mode_name == "basic"
        assert len(self.mode.capabilities) > 0
    
    def test_analyze_with_current_pe(self):
        """Test analysis with current P/E only."""
        input_data = {
            "current_pe": 20.0,
            "industry": "technology",
            "symbol": "TEST"
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["mode"] == "basic"
        assert result["status"] == "success"
        assert result["symbol"] == "TEST"
        assert result["current_pe"] == 20.0
        assert "analysis" in result
        assert "recommendations" in result
    
    def test_analyze_with_compression(self):
        """Test analysis detecting P/E compression."""
        input_data = {
            "current_pe": 15.0,
            "historical_pe": 25.0,  # 40% compression
            "industry": "technology",
            "symbol": "TEST"
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["compression_detected"] is True
        assert result["compression_percentage"] == 40.0
        assert "Compression Detected" in result["analysis"]
    
    def test_analyze_with_expansion(self):
        """Test analysis detecting P/E expansion."""
        input_data = {
            "current_pe": 30.0,
            "historical_pe": 20.0,  # -50% (expansion)
            "industry": "technology"
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["compression_detected"] is False
        assert result["compression_percentage"] < 0
        assert "Expansion" in result["analysis"]
    
    def test_industry_average_comparison(self):
        """Test comparison to industry averages."""
        input_data = {
            "current_pe": 30.0,  # 20% above tech average of 25
            "industry": "technology"
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["industry_average"] == 25.0
        assert "Industry Average" in result["analysis"]
    
    def test_get_industry_average(self):
        """Test industry average lookup."""
        assert self.mode.get_industry_average("technology") == 25.0
        assert self.mode.get_industry_average("finance") == 12.0
        assert self.mode.get_industry_average("unknown") == 18.0
    
    def test_detect_compression(self):
        """Test compression detection logic."""
        # Compression (15% drop)
        assert self.mode.detect_compression(17.0, 20.0) is True
        
        # No compression (5% drop)
        assert self.mode.detect_compression(19.0, 20.0) is False
        
        # Expansion
        assert self.mode.detect_compression(25.0, 20.0) is False
    
    def test_error_handling(self):
        """Test error handling for invalid input."""
        input_data = {"invalid": "data"}
        result = self.mode.analyze(input_data)
        
        # Should handle gracefully
        assert result["status"] in ["success", "error"]


class TestFullMode:
    """Test Full mode operational logic."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.mode = FullMode()
    
    def test_init(self):
        """Test Full mode initialization."""
        assert self.mode is not None
        assert self.mode.mode_name == "full"
    
    def test_api_key_detection(self):
        """Test API key presence detection."""
        # API key may or may not be present in test environment
        assert isinstance(self.mode.api_available, bool)
        assert isinstance(self.mode.api_key, str)
    
    def test_test_api_connection(self):
        """Test API connection testing method."""
        result = self.mode.test_api_connection()
        
        assert "api_key_present" in result
        assert "mode_available" in result
        assert "message" in result
    
    def test_analyze_without_api_key(self):
        """Test that Full mode raises error without API key."""
        if not self.mode.api_available:
            input_data = {"symbol": "TEST"}
            
            with pytest.raises(ValueError) as exc_info:
                self.mode.analyze(input_data)
            
            assert "PERPLEXITY_API_KEY" in str(exc_info.value)
    
    @pytest.mark.skipif(not os.environ.get("PERPLEXITY_API_KEY"),
                       reason="Requires PERPLEXITY_API_KEY")
    def test_analyze_with_api_key(self):
        """Test Full mode analysis with API key present."""
        input_data = {
            "symbol": "AAPL",
            "current_pe": 25.0,
            "industry": "technology"
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["mode"] == "full"
        assert result["api_used"] is True
        assert "data_sources" in result


class TestOfflineMode:
    """Test Offline mode operational logic."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Use temporary cache directory for testing
        import tempfile
        self.temp_dir = tempfile.mkdtemp()
        self.mode = OfflineMode(cache_dir=self.temp_dir)
    
    def teardown_method(self):
        """Clean up test fixtures."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_init(self):
        """Test Offline mode initialization."""
        assert self.mode is not None
        assert self.mode.mode_name == "offline"
        assert self.mode.cache_dir == self.temp_dir
    
    def test_analyze_without_cache(self):
        """Test analysis without cached data."""
        input_data = {
            "symbol": "TEST",
            "current_pe": 20.0,
            "industry": "technology"
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["mode"] == "offline"
        assert result["cache_used"] is False
        assert "cache_warning" in result
    
    def test_update_and_read_cache(self):
        """Test cache update and retrieval."""
        symbol = "TEST"
        data = {
            "pe_history": [
                {"date": "2024-01-01", "value": 25.0},
                {"date": "2024-06-01", "value": 20.0}
            ],
            "industry": "technology"
        }
        
        # Update cache
        success = self.mode.update_cache(symbol, data)
        assert success is True
        
        # Verify cache
        cache_info = self.mode.get_cache_info()
        assert cache_info["cache_available"] is True
        assert symbol in cache_info["cached_symbols"]
        assert cache_info["cached_count"] == 1
    
    def test_analyze_with_cache(self):
        """Test analysis with cached data."""
        # First, populate cache
        symbol = "TEST"
        cache_data = {
            "pe_history": [{"date": "2024-01-01", "value": 25.0}],
            "industry": "technology"
        }
        self.mode.update_cache(symbol, cache_data)
        
        # Now analyze
        input_data = {
            "symbol": symbol,
            "current_pe": 20.0
        }
        
        result = self.mode.analyze(input_data)
        
        assert result["mode"] == "offline"
        assert result["cache_used"] is True
        assert result["cache_enhanced"] is True
        assert "Cached Data Analysis" in result["analysis"]
    
    def test_get_cache_info(self):
        """Test cache information retrieval."""
        info = self.mode.get_cache_info()
        
        assert "cache_available" in info
        assert "cache_dir" in info
        assert "cached_symbols" in info
        assert "cached_count" in info


class TestModeIntegration:
    """Integration tests for mode interactions."""
    
    def test_all_modes_have_consistent_interface(self):
        """Test that all modes have consistent analyze() interface."""
        basic = BasicMode()
        full = FullMode()
        offline = OfflineMode()
        
        input_data = {
            "current_pe": 20.0,
            "historical_pe": 25.0,
            "industry": "technology",
            "symbol": "TEST"
        }
        
        # All should accept same input format
        basic_result = basic.analyze(input_data)
        offline_result = offline.analyze(input_data)
        
        # All should return dictionary with mode field
        assert isinstance(basic_result, dict)
        assert isinstance(offline_result, dict)
        assert "mode" in basic_result
        assert "mode" in offline_result
    
    def test_mode_capabilities(self):
        """Test that all modes report their capabilities."""
        basic = BasicMode()
        full = FullMode()
        offline = OfflineMode()
        
        assert hasattr(basic, 'capabilities')
        assert hasattr(full, 'capabilities')
        assert hasattr(offline, 'capabilities')
        
        assert len(basic.capabilities) > 0
        assert len(full.capabilities) > 0
        assert len(offline.capabilities) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

