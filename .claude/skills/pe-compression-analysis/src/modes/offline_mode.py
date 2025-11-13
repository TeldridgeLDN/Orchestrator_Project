"""
Offline mode implementation using cached data.

This module provides P/E compression analysis using
previously cached data without requiring network access.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import os
import json
from .basic_mode import BasicMode


class OfflineMode:
    """
    Offline operational mode using cached data.
    
    This mode operates entirely from local cache, making it
    suitable for offline environments or when API access is unavailable.
    Combines Basic mode logic with cached historical data.
    """
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize Offline mode.
        
        Args:
            cache_dir: Custom cache directory path (optional)
        """
        self.mode_name = "offline"
        self.basic_mode = BasicMode()
        
        # Set cache directory
        if cache_dir:
            self.cache_dir = cache_dir
        else:
            skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.cache_dir = os.path.join(skill_dir, "..", "cache")
        
        self.cache_file = os.path.join(self.cache_dir, "pe_data.json")
        self.cache_available = os.path.exists(self.cache_file)
        
        self.capabilities = [
            "Cached historical data analysis",
            "Offline P/E compression detection",
            "No network dependency",
            "Fast local analysis"
        ]
        
        # Load cache if available
        self.cached_data = self._load_cache() if self.cache_available else {}
    
    def analyze(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute P/E compression analysis in Offline mode.
        
        Args:
            input_data: Analysis input parameters containing:
                - symbol: Stock symbol to look up in cache
                - current_pe: Current P/E ratio (optional)
                - historical_pe: Historical P/E ratio (optional)
                - industry: Industry sector (optional)
        
        Returns:
            Analysis results dictionary with cached data
        """
        try:
            symbol = input_data.get("symbol", "")
            
            # Start with basic analysis
            basic_results = self.basic_mode.analyze(input_data)
            
            # Enhance with cached data if available
            cache_data = self._get_cached_data(symbol) if symbol else {}
            
            offline_results = {
                **basic_results,
                "mode": self.mode_name,
                "cache_used": bool(cache_data),
                "cache_available": self.cache_available,
                "capabilities": self.capabilities,
                "data_sources": ["Basic analysis", "Local cache"]
            }
            
            # Add cached data enhancements
            if cache_data:
                offline_results["cached_data"] = cache_data
                cache_analysis = self._analyze_cache_data(
                    basic_results,
                    cache_data
                )
                offline_results["analysis"] += "\n\n" + cache_analysis
                offline_results["cache_enhanced"] = True
            else:
                if symbol:
                    offline_results["cache_warning"] = (
                        f"No cached data for symbol: {symbol}"
                    )
                else:
                    offline_results["cache_warning"] = "No symbol provided for cache lookup"
                offline_results["cache_enhanced"] = False
            
            return offline_results
            
        except Exception as e:
            return {
                "mode": self.mode_name,
                "status": "error",
                "error": str(e),
                "fallback": "Basic mode used due to cache error",
                "basic_results": self.basic_mode.analyze(input_data),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    
    def _load_cache(self) -> Dict[str, Any]:
        """
        Load cached data from JSON file.
        
        Returns:
            Dictionary containing cached P/E data
        """
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load cache: {e}")
            return {}
    
    def _get_cached_data(self, symbol: str) -> Dict[str, Any]:
        """
        Get cached data for a specific symbol.
        
        Args:
            symbol: Stock symbol to look up
        
        Returns:
            Cached data dictionary for the symbol
        """
        if not symbol or not self.cached_data:
            return {}
        
        return self.cached_data.get(symbol.upper(), {})
    
    def _analyze_cache_data(
        self,
        basic_results: Dict[str, Any],
        cache_data: Dict[str, Any]
    ) -> str:
        """
        Analyze cached data and create additional insights.
        
        Args:
            basic_results: Results from basic mode analysis
            cache_data: Cached data for the symbol
        
        Returns:
            Analysis text based on cached data
        """
        analysis_text = ["", "=== Cached Data Analysis (Offline Mode) ==="]
        
        # Add cached P/E history
        if "pe_history" in cache_data:
            pe_history = cache_data["pe_history"]
            analysis_text.append(f"Historical P/E Data Points: {len(pe_history)}")
            
            if pe_history:
                latest = pe_history[-1]
                analysis_text.append(f"Last Cached P/E: {latest.get('value', 'N/A')}")
                analysis_text.append(f"Cache Date: {latest.get('date', 'N/A')}")
        
        # Add cached industry data
        if "industry" in cache_data:
            analysis_text.append(f"Cached Industry: {cache_data['industry']}")
        
        # Add cache metadata
        if "cache_timestamp" in cache_data:
            cache_age = self._calculate_cache_age(cache_data["cache_timestamp"])
            analysis_text.append(f"Cache Age: {cache_age}")
            
            if cache_age.endswith("days") and int(cache_age.split()[0]) > 30:
                analysis_text.append("⚠️  Cache data may be outdated (>30 days old)")
        
        analysis_text.append("ℹ️  Using offline mode - no network access required")
        
        return "\n".join(analysis_text)
    
    def _calculate_cache_age(self, cache_timestamp: str) -> str:
        """
        Calculate how old the cached data is.
        
        Args:
            cache_timestamp: ISO format timestamp string
        
        Returns:
            Human-readable cache age string
        """
        try:
            cached_time = datetime.fromisoformat(cache_timestamp.replace('Z', '+00:00'))
            now = datetime.now(cached_time.tzinfo)
            delta = now - cached_time
            
            if delta.days > 0:
                return f"{delta.days} days"
            elif delta.seconds > 3600:
                return f"{delta.seconds // 3600} hours"
            else:
                return f"{delta.seconds // 60} minutes"
        except Exception:
            return "Unknown"
    
    def update_cache(self, symbol: str, data: Dict[str, Any]) -> bool:
        """
        Update cache with new data for a symbol.
        
        Args:
            symbol: Stock symbol
            data: Data to cache
        
        Returns:
            True if cache updated successfully, False otherwise
        """
        try:
            # Ensure cache directory exists
            os.makedirs(self.cache_dir, exist_ok=True)
            
            # Load existing cache or create new
            if self.cache_available:
                cache = self._load_cache()
            else:
                cache = {}
            
            # Add timestamp
            data["cache_timestamp"] = datetime.utcnow().isoformat() + "Z"
            
            # Update cache
            cache[symbol.upper()] = data
            
            # Save to file
            with open(self.cache_file, 'w') as f:
                json.dump(cache, f, indent=2)
            
            # Reload cache
            self.cached_data = cache
            self.cache_available = True
            
            return True
            
        except Exception as e:
            print(f"Error updating cache: {e}")
            return False
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Get information about the cache status.
        
        Returns:
            Dictionary with cache information
        """
        return {
            "cache_available": self.cache_available,
            "cache_dir": self.cache_dir,
            "cache_file": self.cache_file,
            "cached_symbols": list(self.cached_data.keys()) if self.cached_data else [],
            "cached_count": len(self.cached_data) if self.cached_data else 0
        }

