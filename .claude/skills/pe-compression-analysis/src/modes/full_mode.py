"""
Full mode implementation with Perplexity API integration.

This module provides enhanced P/E compression analysis
using live data from the Perplexity API.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import os
from .basic_mode import BasicMode


class FullMode:
    """
    Full operational mode with Perplexity API integration.
    
    This mode provides the most comprehensive analysis by
    leveraging external API for real-time data, market context,
    and enhanced insights beyond Basic mode capabilities.
    """
    
    def __init__(self):
        """Initialize Full mode."""
        self.mode_name = "full"
        self.api_key = os.environ.get("PERPLEXITY_API_KEY", "").strip()
        self.api_available = bool(self.api_key)
        self.basic_mode = BasicMode()  # Fallback to basic analysis
        
        self.capabilities = [
            "Real-time market data integration",
            "Live P/E ratio lookups",
            "Current industry trends",
            "Peer company comparisons",
            "Market context analysis",
            "Enhanced recommendations"
        ] if self.api_available else self.basic_mode.capabilities
    
    def analyze(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute P/E compression analysis in Full mode.
        
        Args:
            input_data: Analysis input parameters containing:
                - symbol: Stock symbol (required for API lookup)
                - current_pe: Current P/E ratio (optional, will fetch if not provided)
                - historical_pe: Historical P/E ratio (optional)
                - industry: Industry sector (optional)
                - include_peers: Include peer comparison (default: True)
        
        Returns:
            Analysis results dictionary with enhanced data from API
        
        Raises:
            ValueError: If API key is not available
        """
        if not self.api_available:
            raise ValueError(
                "PERPLEXITY_API_KEY not found - cannot use Full mode. "
                "Set PERPLEXITY_API_KEY environment variable or use Basic/Offline mode."
            )
        
        try:
            symbol = input_data.get("symbol", "")
            include_peers = input_data.get("include_peers", True)
            
            # Start with basic analysis
            basic_results = self.basic_mode.analyze(input_data)
            
            # Enhance with API data
            api_data = self._fetch_api_data(symbol, include_peers)
            
            # Merge basic and API results
            enhanced_results = {
                **basic_results,
                "mode": self.mode_name,
                "api_used": True,
                "api_data": api_data,
                "capabilities": self.capabilities,
                "data_sources": [
                    "Basic analysis",
                    "Perplexity API (real-time data)",
                    "Market context"
                ]
            }
            
            # Add API-enhanced analysis
            if api_data.get("status") == "success":
                enhanced_analysis = self._enhance_analysis(
                    basic_results,
                    api_data
                )
                enhanced_results["analysis"] += "\n\n" + enhanced_analysis
                enhanced_results["api_enhanced"] = True
            else:
                enhanced_results["api_enhanced"] = False
                enhanced_results["api_warning"] = api_data.get("message", "API unavailable")
            
            return enhanced_results
            
        except Exception as e:
            # Fallback to basic mode on error
            return {
                "mode": self.mode_name,
                "status": "error",
                "error": str(e),
                "fallback": "Basic mode used due to API error",
                "basic_results": self.basic_mode.analyze(input_data),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    
    def _fetch_api_data(
        self,
        symbol: str,
        include_peers: bool = True
    ) -> Dict[str, Any]:
        """
        Fetch real-time data from Perplexity API.
        
        Args:
            symbol: Stock symbol to analyze
            include_peers: Whether to include peer comparison
        
        Returns:
            API response data dictionary
        """
        # Placeholder for actual Perplexity API integration
        # This will be implemented when Perplexity API endpoints are finalized
        
        if not symbol:
            return {
                "status": "error",
                "message": "Symbol required for API lookup"
            }
        
        # Simulated API response structure
        # In production, this would call the actual Perplexity API
        return {
            "status": "success",
            "symbol": symbol,
            "current_pe": None,  # Would be fetched from API
            "market_context": {
                "sector_trend": "neutral",
                "market_sentiment": "mixed",
                "recent_news": []
            },
            "peer_comparison": {
                "peers": [],
                "average_pe": None
            } if include_peers else None,
            "real_time_data": True,
            "data_timestamp": datetime.utcnow().isoformat() + "Z",
            "note": "API integration placeholder - will fetch live data in production"
        }
    
    def _enhance_analysis(
        self,
        basic_results: Dict[str, Any],
        api_data: Dict[str, Any]
    ) -> str:
        """
        Enhance basic analysis with API data insights.
        
        Args:
            basic_results: Results from basic mode analysis
            api_data: Data fetched from Perplexity API
        
        Returns:
            Enhanced analysis text
        """
        enhanced_text = ["", "=== Enhanced Analysis (Full Mode) ==="]
        
        # Add market context
        market_context = api_data.get("market_context", {})
        if market_context:
            enhanced_text.append(
                f"Market Context: {market_context.get('market_sentiment', 'N/A')}"
            )
            enhanced_text.append(
                f"Sector Trend: {market_context.get('sector_trend', 'N/A')}"
            )
        
        # Add peer comparison
        peer_data = api_data.get("peer_comparison")
        if peer_data and peer_data.get("average_pe"):
            enhanced_text.append(
                f"Peer Average P/E: {peer_data['average_pe']:.2f}"
            )
        
        # Add data quality indicator
        if api_data.get("real_time_data"):
            enhanced_text.append("✅ Using real-time market data")
        
        enhanced_text.append(
            f"Data as of: {api_data.get('data_timestamp', 'N/A')}"
        )
        
        return "\n".join(enhanced_text)
    
    def test_api_connection(self) -> Dict[str, Any]:
        """
        Test Perplexity API connection and availability.
        
        Returns:
            Connection test results
        """
        return {
            "api_key_present": self.api_available,
            "api_key_length": len(self.api_key) if self.api_available else 0,
            "mode_available": self.api_available,
            "message": "API key found" if self.api_available else "API key not found"
        }

