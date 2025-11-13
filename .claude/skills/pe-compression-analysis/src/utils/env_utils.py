"""
Environment detection utilities.

This module provides functions for checking API keys,
cache availability, and overall environment state.
"""

import os
from typing import Dict, Any


def check_api_key(key_name: str) -> bool:
    """
    Check if an API key is present in the environment.
    
    Args:
        key_name: Name of the environment variable to check
    
    Returns:
        True if key exists and is non-empty, False otherwise
    """
    value = os.environ.get(key_name, "").strip()
    return bool(value)


def get_environment_state() -> Dict[str, Any]:
    """
    Get current environment state for mode selection.
    
    Returns:
        Dictionary containing environment state information
    """
    return {
        "has_perplexity_key": check_api_key("PERPLEXITY_API_KEY"),
        "has_cache": _check_cache_availability(),
        "python_version": _get_python_version(),
    }


def _check_cache_availability() -> bool:
    """
    Check if cached data is available for offline mode.
    
    Returns:
        True if cache exists and is valid, False otherwise
    """
    # Placeholder for cache checking logic
    # Will be implemented when cache strategy is defined
    cache_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "cache",
        "pe_data.json"
    )
    return os.path.exists(cache_path)


def _get_python_version() -> str:
    """
    Get Python version string.
    
    Returns:
        Python version (e.g., "3.10.5")
    """
    import sys
    return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

