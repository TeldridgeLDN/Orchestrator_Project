"""
Integration connector for Workflow 9 Execution Skill.

This module provides a robust, versioned interface for the P/E Compression Analysis Skill
to integrate seamlessly with the Workflow 9 Execution Skill.

Interface Version: 1.0.0
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import json


class Workflow9InterfaceError(Exception):
    """Custom exception for Workflow 9 integration errors."""
    pass


class Workflow9Connector:
    """
    Connector for integrating with Workflow 9 Execution Skill.
    
    Provides a well-defined, versioned interface with clear input/output contracts
    for seamless integration with downstream workflow execution.
    
    Interface Contract:
    - Version: 1.0.0
    - Input: P/E compression analysis results dictionary
    - Output: Formatted workflow action package with metadata
    - Error Handling: Comprehensive validation and error reporting
    """
    
    # Interface version for compatibility tracking
    INTERFACE_VERSION = "1.0.0"
    
    # Skill identifier for workflow routing
    SKILL_ID = "pe-compression-analysis"
    
    # Supported output formats
    SUPPORTED_FORMATS = ["json", "markdown", "both"]
    
    def __init__(self, output_format: str = "both", strict_validation: bool = True):
        """
        Initialize the Workflow 9 connector.
        
        Args:
            output_format: Output format ("json", "markdown", "both")
            strict_validation: Enable strict input validation
        """
        if output_format not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported output format: {output_format}")
        
        self.output_format = output_format
        self.strict_validation = strict_validation
        self.last_output = None
        self.error_log = []
    
    def prepare_workflow_action(self, analysis_results: Dict[str, Any],
                                markdown_output: Optional[str] = None) -> Dict[str, Any]:
        """
        Prepare analysis results for Workflow 9 consumption.
        
        This is the primary integration method that converts P/E compression analysis
        results into a structured workflow action package.
        
        Args:
            analysis_results: Raw analysis results from the skill containing:
                - mode: Analysis mode used
                - symbol: Stock symbol analyzed
                - compression_detected: Boolean
                - compression_percentage: Float
                - current_pe: Current P/E ratio (optional)
                - historical_pe: Historical P/E ratio (optional)
                - analysis: Analysis text
                - recommendations: List of recommendations
            markdown_output: Pre-rendered Markdown decision framework (optional)
        
        Returns:
            Formatted workflow action package with structure:
            {
                "metadata": {...},           # Skill metadata and versioning
                "analysis": {...},           # Structured analysis results
                "decision_framework": {...}, # Decision support data
                "workflow_actions": [...],   # Suggested workflow actions
                "outputs": {...}             # Formatted outputs (JSON/Markdown)
            }
        
        Raises:
            Workflow9InterfaceError: If validation fails or required data is missing
        """
        # Validate input
        if self.strict_validation:
            self._validate_analysis_results(analysis_results)
        
        # Build workflow action package
        workflow_action = {
            "metadata": self._build_metadata(),
            "analysis": self._extract_analysis_data(analysis_results),
            "decision_framework": self._build_decision_framework(analysis_results),
            "workflow_actions": self._generate_workflow_actions(analysis_results),
            "outputs": self._format_outputs(analysis_results, markdown_output)
        }
        
        # Store for retrieval
        self.last_output = workflow_action
        
        return workflow_action
    
    def _build_metadata(self) -> Dict[str, Any]:
        """
        Build metadata section for workflow routing and versioning.
        
        Returns:
            Metadata dictionary
        """
        return {
            "skill_id": self.SKILL_ID,
            "interface_version": self.INTERFACE_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "output_format": self.output_format
        }
    
    def _extract_analysis_data(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract and structure core analysis data.
        
        Args:
            results: Raw analysis results
        
        Returns:
            Structured analysis data
        """
        return {
            "symbol": results.get("symbol"),
            "mode": results.get("mode"),
            "compression_detected": results.get("compression_detected", False),
            "compression_percentage": results.get("compression_percentage", 0.0),
            "current_pe": results.get("current_pe"),
            "historical_pe": results.get("historical_pe"),
            "industry_average": results.get("industry_average"),
            "analysis_text": results.get("analysis", ""),
            "status": self._determine_status(results)
        }
    
    def _build_decision_framework(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build decision support framework from analysis results.
        
        Args:
            results: Raw analysis results
        
        Returns:
            Decision framework data
        """
        return {
            "compression_alert": results.get("compression_detected", False),
            "severity": self._assess_severity(results),
            "confidence": self._assess_confidence(results),
            "recommendations": results.get("recommendations", []),
            "risk_factors": self._extract_risk_factors(results),
            "next_actions": self._generate_next_actions(results)
        }
    
    def _generate_workflow_actions(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate suggested workflow actions based on analysis results.
        
        Args:
            results: Raw analysis results
        
        Returns:
            List of workflow action suggestions
        """
        actions = []
        compression_detected = results.get("compression_detected", False)
        
        if compression_detected:
            # High-priority actions for compression
            actions.extend([
                {
                    "action_type": "alert",
                    "priority": "high",
                    "description": "P/E compression detected - review fundamentals",
                    "target_workflow": "fundamental_analysis"
                },
                {
                    "action_type": "research",
                    "priority": "high",
                    "description": "Investigate recent news and events",
                    "target_workflow": "news_sentiment_analysis"
                },
                {
                    "action_type": "comparison",
                    "priority": "medium",
                    "description": "Compare with peer companies",
                    "target_workflow": "peer_comparison"
                }
            ])
        else:
            # Standard monitoring actions
            actions.extend([
                {
                    "action_type": "monitor",
                    "priority": "low",
                    "description": "Continue tracking P/E trends",
                    "target_workflow": "valuation_monitoring"
                }
            ])
        
        return actions
    
    def _format_outputs(self, results: Dict[str, Any],
                       markdown_output: Optional[str] = None) -> Dict[str, Any]:
        """
        Format outputs according to configured output format.
        
        Args:
            results: Raw analysis results
            markdown_output: Pre-rendered Markdown (optional)
        
        Returns:
            Formatted outputs dictionary
        """
        outputs = {}
        
        if self.output_format in ["json", "both"]:
            outputs["json"] = results
        
        if self.output_format in ["markdown", "both"]:
            if markdown_output:
                outputs["markdown"] = markdown_output
            else:
                outputs["markdown"] = self._generate_simple_markdown(results)
        
        return outputs
    
    def _determine_status(self, results: Dict[str, Any]) -> str:
        """
        Determine overall analysis status.
        
        Args:
            results: Analysis results
        
        Returns:
            Status string ("critical", "alert", "warning", "normal")
        """
        if results.get("compression_detected", False):
            compression_pct = abs(results.get("compression_percentage", 0.0))
            if compression_pct > 30:
                return "critical"
            elif compression_pct >= 20:
                return "alert"
            else:
                return "warning"
        return "normal"
    
    def _assess_severity(self, results: Dict[str, Any]) -> str:
        """
        Assess compression severity.
        
        Args:
            results: Analysis results
        
        Returns:
            Severity level ("high", "medium", "low")
        """
        if not results.get("compression_detected", False):
            return "low"
        
        compression_pct = abs(results.get("compression_percentage", 0.0))
        if compression_pct >= 30:
            return "high"
        elif compression_pct >= 20:
            return "medium"
        else:
            return "low"
    
    def _assess_confidence(self, results: Dict[str, Any]) -> str:
        """
        Assess analysis confidence based on mode and data quality.
        
        Args:
            results: Analysis results
        
        Returns:
            Confidence level ("high", "medium", "low")
        """
        mode = results.get("mode", "unknown")
        
        if mode == "full":
            return "high"
        elif mode == "basic":
            return "medium"
        else:  # offline
            return "low"
    
    def _extract_risk_factors(self, results: Dict[str, Any]) -> List[str]:
        """
        Extract risk factors from analysis.
        
        Args:
            results: Analysis results
        
        Returns:
            List of risk factors
        """
        risks = []
        
        # Mode-based risks
        mode = results.get("mode", "unknown")
        if mode != "full":
            risks.append(f"Analysis based on {mode} mode - data may be limited or outdated")
        
        # Add limitations
        limitations = results.get("limitations", [])
        risks.extend(limitations)
        
        return risks
    
    def _generate_next_actions(self, results: Dict[str, Any]) -> List[str]:
        """
        Generate specific next actions.
        
        Args:
            results: Analysis results
        
        Returns:
            List of next actions
        """
        actions = []
        compression_detected = results.get("compression_detected", False)
        
        if compression_detected:
            actions.extend([
                "Review recent earnings reports and guidance",
                "Check for insider trading activity",
                "Analyze cash flow and balance sheet strength",
                "Compare with 3-5 peer companies",
                "Assess if compression creates buying opportunity"
            ])
        else:
            actions.extend([
                "Continue monitoring P/E trends",
                "Review quarterly earnings when released",
                "Track industry developments",
                "Reassess if P/E changes >10%"
            ])
        
        return actions
    
    def _generate_simple_markdown(self, results: Dict[str, Any]) -> str:
        """
        Generate simple Markdown output if full renderer not available.
        
        Args:
            results: Analysis results
        
        Returns:
            Basic Markdown summary
        """
        symbol = results.get("symbol", "UNKNOWN")
        mode = results.get("mode", "unknown")
        compression = results.get("compression_detected", False)
        
        return f"""# P/E Compression Analysis
**Symbol**: {symbol}
**Mode**: {mode.title()}
**Compression Detected**: {'Yes' if compression else 'No'}
"""
    
    def _validate_analysis_results(self, results: Dict[str, Any]) -> None:
        """
        Validate analysis results structure and required fields.
        
        Args:
            results: Analysis results to validate
        
        Raises:
            Workflow9InterfaceError: If validation fails
        """
        if not isinstance(results, dict):
            raise Workflow9InterfaceError("Analysis results must be a dictionary")
        
        # Check for required fields
        required_fields = ["mode"]
        missing_fields = [f for f in required_fields if f not in results]
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            self.error_log.append(error_msg)
            raise Workflow9InterfaceError(error_msg)
    
    def get_last_output(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve the last generated workflow action.
        
        Returns:
            Last workflow action package or None
        """
        return self.last_output
    
    def get_error_log(self) -> List[str]:
        """
        Retrieve error log.
        
        Returns:
            List of error messages
        """
        return self.error_log.copy()
    
    def clear_error_log(self) -> None:
        """Clear the error log."""
        self.error_log.clear()
    
    def export_interface_specification(self) -> Dict[str, Any]:
        """
        Export complete interface specification for documentation.
        
        Returns:
            Interface specification dictionary
        """
        return {
            "interface_version": self.INTERFACE_VERSION,
            "skill_id": self.SKILL_ID,
            "supported_formats": self.SUPPORTED_FORMATS,
            "input_contract": {
                "required_fields": ["mode"],
                "optional_fields": [
                    "symbol", "compression_detected", "compression_percentage",
                    "current_pe", "historical_pe", "industry_average",
                    "analysis", "recommendations", "limitations"
                ]
            },
            "output_contract": {
                "sections": ["metadata", "analysis", "decision_framework",
                            "workflow_actions", "outputs"]
            },
            "workflow_actions": [
                {"type": "alert", "description": "High-priority compression alerts"},
                {"type": "research", "description": "Research task generation"},
                {"type": "comparison", "description": "Peer comparison requests"},
                {"type": "monitor", "description": "Standard monitoring tasks"}
            ]
        }
