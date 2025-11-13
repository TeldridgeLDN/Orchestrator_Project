"""
Basic mode implementation - no external API required.

This module provides P/E compression analysis using only
built-in functionality without external dependencies.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


class BasicMode:
    """
    Basic operational mode for P/E compression analysis.
    
    This mode operates without external APIs, providing
    fundamental analysis capabilities using built-in logic
    and local data structures.
    """
    
    # Industry average P/E ratios (static baseline data)
    INDUSTRY_PE_AVERAGES = {
        "technology": 25.0,
        "healthcare": 18.0,
        "finance": 12.0,
        "consumer": 20.0,
        "energy": 15.0,
        "industrials": 16.0,
        "utilities": 14.0,
        "real_estate": 22.0,
        "materials": 13.0,
        "default": 18.0
    }
    
    def __init__(self):
        """Initialize Basic mode."""
        self.mode_name = "basic"
        self.capabilities = [
            "Basic P/E ratio analysis",
            "Industry average comparison",
            "Simple compression detection",
            "Historical trend estimation"
        ]
    
    def analyze(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute P/E compression analysis in Basic mode.
        
        Args:
            input_data: Analysis input parameters containing:
                - current_pe: Current P/E ratio (optional)
                - historical_pe: Historical P/E ratio (optional)
                - industry: Industry sector (optional)
                - symbol: Stock symbol (optional)
        
        Returns:
            Analysis results dictionary with:
                - mode: Operating mode
                - status: Success/error status
                - compression_detected: Boolean
                - compression_percentage: Percentage change
                - analysis: Detailed analysis text
                - recommendations: List of recommendations
                - timestamp: Analysis timestamp
        """
        try:
            # Extract input parameters
            current_pe = input_data.get("current_pe")
            historical_pe = input_data.get("historical_pe")
            industry = input_data.get("industry", "default").lower()
            symbol = input_data.get("symbol", "UNKNOWN")
            
            # Get industry average
            industry_avg = self.INDUSTRY_PE_AVERAGES.get(
                industry, 
                self.INDUSTRY_PE_AVERAGES["default"]
            )
            
            # Perform analysis
            compression_detected = False
            compression_percentage = 0.0
            analysis_text = []
            recommendations = []
            
            # Analyze if we have P/E data
            if current_pe is not None:
                analysis_text.append(f"Current P/E Ratio: {current_pe:.2f}")
                
                # Compare to industry average
                industry_diff = ((current_pe - industry_avg) / industry_avg) * 100
                analysis_text.append(
                    f"Industry Average P/E ({industry}): {industry_avg:.2f}"
                )
                analysis_text.append(
                    f"Difference from Industry: {industry_diff:+.2f}%"
                )
                
                if abs(industry_diff) > 20:
                    if industry_diff < 0:
                        analysis_text.append(
                            "⚠️  Trading significantly below industry average"
                        )
                        recommendations.append(
                            "Consider if undervaluation presents opportunity"
                        )
                    else:
                        analysis_text.append(
                            "⚠️  Trading significantly above industry average"
                        )
                        recommendations.append(
                            "Verify if premium valuation is justified"
                        )
                
                # Analyze historical compression if available
                if historical_pe is not None:
                    compression_percentage = (
                        (historical_pe - current_pe) / historical_pe
                    ) * 100
                    
                    analysis_text.append(
                        f"Historical P/E: {historical_pe:.2f}"
                    )
                    analysis_text.append(
                        f"P/E Change: {compression_percentage:+.2f}%"
                    )
                    
                    if compression_percentage > 10:
                        compression_detected = True
                        analysis_text.append(
                            f"✅ P/E Compression Detected: {compression_percentage:.2f}%"
                        )
                        recommendations.append(
                            "Significant P/E compression - investigate fundamentals"
                        )
                    elif compression_percentage < -10:
                        analysis_text.append(
                            f"📈 P/E Expansion Detected: {abs(compression_percentage):.2f}%"
                        )
                        recommendations.append(
                            "P/E expanding - monitor for overvaluation risk"
                        )
                    else:
                        analysis_text.append(
                            "📊 P/E relatively stable"
                        )
            else:
                analysis_text.append(
                    "⚠️  Insufficient data for detailed analysis"
                )
                recommendations.append(
                    "Provide current_pe value for analysis"
                )
            
            return {
                "mode": self.mode_name,
                "status": "success",
                "symbol": symbol,
                "compression_detected": compression_detected,
                "compression_percentage": compression_percentage,
                "current_pe": current_pe,
                "historical_pe": historical_pe,
                "industry_average": industry_avg,
                "analysis": "\n".join(analysis_text),
                "recommendations": recommendations,
                "capabilities": self.capabilities,
                "limitations": [
                    "No real-time data access",
                    "Static industry averages",
                    "Limited historical context"
                ],
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            return {
                "mode": self.mode_name,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    
    def get_industry_average(self, industry: str) -> float:
        """
        Get industry average P/E ratio.
        
        Args:
            industry: Industry sector name
        
        Returns:
            Average P/E ratio for the industry
        """
        return self.INDUSTRY_PE_AVERAGES.get(
            industry.lower(),
            self.INDUSTRY_PE_AVERAGES["default"]
        )
    
    def detect_compression(
        self,
        current_pe: float,
        historical_pe: float,
        threshold: float = 10.0
    ) -> bool:
        """
        Detect if P/E compression has occurred.
        
        Args:
            current_pe: Current P/E ratio
            historical_pe: Historical P/E ratio
            threshold: Compression threshold percentage (default: 10%)
        
        Returns:
            True if compression detected, False otherwise
        """
        if historical_pe == 0:
            return False
        
        compression_pct = ((historical_pe - current_pe) / historical_pe) * 100
        return compression_pct > threshold

