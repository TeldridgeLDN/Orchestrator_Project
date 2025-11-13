"""
Basic import tests to verify module structure.
"""

import pytest


@pytest.mark.skip(reason="Main package __init__ imports not fully implemented yet")
def test_main_package_import():
    """Test that main package can be imported."""
    try:
        import sys
        import os
        # Add src to path for testing
        src_path = os.path.join(os.path.dirname(__file__), "..", "src")
        sys.path.insert(0, src_path)
        
        # Now try imports
        from core import PECompressionAnalyzer
        from nlp import KeywordDetector
        from modes import ModeSelector, AnalysisMode
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")


@pytest.mark.skip(reason="Core analyzer is placeholder - to be implemented in future iteration")
def test_core_module_import():
    """Test that core module can be imported."""
    try:
        import sys
        import os
        src_path = os.path.join(os.path.dirname(__file__), "..", "src")
        sys.path.insert(0, src_path)
        
        from core.analyzer import PECompressionAnalyzer
        assert PECompressionAnalyzer is not None
    except ImportError as e:
        pytest.fail(f"Core module import failed: {e}")


def test_nlp_module_import():
    """Test that NLP module can be imported."""
    try:
        import sys
        import os
        src_path = os.path.join(os.path.dirname(__file__), "..", "src")
        sys.path.insert(0, src_path)
        
        from nlp.detector import KeywordDetector
        assert KeywordDetector is not None
    except ImportError as e:
        pytest.fail(f"NLP module import failed: {e}")


def test_modes_module_import():
    """Test that modes module can be imported."""
    try:
        import sys
        import os
        src_path = os.path.join(os.path.dirname(__file__), "..", "src")
        sys.path.insert(0, src_path)
        
        from modes.mode_selector import ModeSelector, AnalysisMode
        from modes.basic_mode import BasicMode
        from modes.full_mode import FullMode
        from modes.offline_mode import OfflineMode
        
        assert all([
            ModeSelector is not None,
            AnalysisMode is not None,
            BasicMode is not None,
            FullMode is not None,
            OfflineMode is not None
        ])
    except ImportError as e:
        pytest.fail(f"Modes module import failed: {e}")


def test_utils_module_import():
    """Test that utils module can be imported."""
    try:
        import sys
        import os
        src_path = os.path.join(os.path.dirname(__file__), "..", "src")
        sys.path.insert(0, src_path)
        
        from utils.env_utils import check_api_key, get_environment_state
        from utils.markdown_renderer import render_decision_framework
        from utils.config import Config
        
        assert all([
            check_api_key is not None,
            get_environment_state is not None,
            render_decision_framework is not None,
            Config is not None
        ])
    except ImportError as e:
        pytest.fail(f"Utils module import failed: {e}")


def test_integration_module_import():
    """Test that integration module can be imported."""
    try:
        import sys
        import os
        src_path = os.path.join(os.path.dirname(__file__), "..", "src")
        sys.path.insert(0, src_path)
        
        from integration.workflow9_connector import Workflow9Connector
        assert Workflow9Connector is not None
    except ImportError as e:
        pytest.fail(f"Integration module import failed: {e}")

