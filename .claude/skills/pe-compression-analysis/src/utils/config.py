"""
Configuration management for P/E Compression Analysis.

This module provides centralized configuration handling.
"""

import os
from typing import Dict, Any


class Config:
    """
    Configuration manager for P/E Compression Analysis skill.
    """
    
    # Performance targets
    MAX_MODE_SELECTION_TIME = 2.0  # seconds
    MAX_ANALYSIS_TIME = 10.0  # seconds
    
    # Keyword detection settings
    CASE_SENSITIVE = False
    MIN_KEYWORD_LENGTH = 2
    
    # Mode selection settings
    PREFER_FULL_MODE = True
    FALLBACK_TO_BASIC = True
    
    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """
        Get current configuration as dictionary.
        
        Returns:
            Configuration dictionary
        """
        return {
            "performance": {
                "max_mode_selection_time": cls.MAX_MODE_SELECTION_TIME,
                "max_analysis_time": cls.MAX_ANALYSIS_TIME
            },
            "keyword_detection": {
                "case_sensitive": cls.CASE_SENSITIVE,
                "min_keyword_length": cls.MIN_KEYWORD_LENGTH
            },
            "mode_selection": {
                "prefer_full_mode": cls.PREFER_FULL_MODE,
                "fallback_to_basic": cls.FALLBACK_TO_BASIC
            }
        }
    
    @classmethod
    def validate_environment(cls) -> Dict[str, Any]:
        """
        Validate environment configuration.
        
        Returns:
            Validation results dictionary
        """
        issues = []
        warnings = []
        
        # Check Python version
        import sys
        if sys.version_info < (3, 10):
            issues.append("Python 3.10+ required")
        
        # Check for optional API key
        if not os.environ.get("PERPLEXITY_API_KEY"):
            warnings.append("PERPLEXITY_API_KEY not set - Full mode unavailable")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }

