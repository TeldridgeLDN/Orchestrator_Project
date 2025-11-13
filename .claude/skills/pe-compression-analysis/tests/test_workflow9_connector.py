"""
Comprehensive tests for Workflow 9 integration connector.

Tests cover:
- Interface initialization and configuration
- Workflow action preparation
- Data validation and error handling
- Workflow action generation
- Output formatting
- Interface specification export
"""

import pytest
from src.integration.workflow9_connector import (
    Workflow9Connector,
    Workflow9InterfaceError
)


class TestConnectorInitialization:
    """Test suite for connector initialization."""
    
    def test_default_initialization(self):
        """Test connector with default settings."""
        connector = Workflow9Connector()
        
        assert connector.output_format == "both"
        assert connector.strict_validation is True
        assert connector.last_output is None
        assert connector.error_log == []
    
    def test_json_output_format(self):
        """Test connector with JSON-only output."""
        connector = Workflow9Connector(output_format="json")
        
        assert connector.output_format == "json"
    
    def test_markdown_output_format(self):
        """Test connector with Markdown-only output."""
        connector = Workflow9Connector(output_format="markdown")
        
        assert connector.output_format == "markdown"
    
    def test_invalid_output_format(self):
        """Test connector rejects invalid output format."""
        with pytest.raises(ValueError, match="Unsupported output format"):
            Workflow9Connector(output_format="xml")
    
    def test_strict_validation_disabled(self):
        """Test connector with validation disabled."""
        connector = Workflow9Connector(strict_validation=False)
        
        assert connector.strict_validation is False


class TestWorkflowActionPreparation:
    """Test suite for workflow action preparation."""
    
    def test_prepare_basic_action(self):
        """Test preparing workflow action with basic data."""
        connector = Workflow9Connector()
        results = {
            "mode": "basic",
            "symbol": "AAPL",
            "compression_detected": True,
            "compression_percentage": -25.0
        }
        
        action = connector.prepare_workflow_action(results)
        
        assert "metadata" in action
        assert "analysis" in action
        assert "decision_framework" in action
        assert "workflow_actions" in action
        assert "outputs" in action
    
    def test_metadata_structure(self):
        """Test metadata section structure."""
        connector = Workflow9Connector()
        results = {"mode": "basic"}
        
        action = connector.prepare_workflow_action(results)
        metadata = action["metadata"]
        
        assert metadata["skill_id"] == "pe-compression-analysis"
        assert metadata["interface_version"] == "1.0.0"
        assert "timestamp" in metadata
        assert metadata["output_format"] == "both"
    
    def test_analysis_data_extraction(self):
        """Test analysis data extraction."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "symbol": "GOOGL",
            "compression_detected": False,
            "compression_percentage": -5.0,
            "current_pe": 25.0,
            "historical_pe": 24.0,
            "industry_average": 26.0,
            "analysis": "Test analysis"
        }
        
        action = connector.prepare_workflow_action(results)
        analysis = action["analysis"]
        
        assert analysis["symbol"] == "GOOGL"
        assert analysis["mode"] == "full"
        assert analysis["compression_detected"] is False
        assert analysis["compression_percentage"] == -5.0
        assert analysis["current_pe"] == 25.0
        assert analysis["status"] == "normal"
    
    def test_with_markdown_output(self):
        """Test action preparation with pre-rendered Markdown."""
        connector = Workflow9Connector()
        results = {"mode": "basic", "symbol": "TEST"}
        markdown = "# Test Markdown Output"
        
        action = connector.prepare_workflow_action(results, markdown_output=markdown)
        
        assert "markdown" in action["outputs"]
        assert action["outputs"]["markdown"] == markdown
    
    def test_last_output_storage(self):
        """Test that last output is stored correctly."""
        connector = Workflow9Connector()
        results = {"mode": "basic"}
        
        action = connector.prepare_workflow_action(results)
        
        assert connector.get_last_output() == action


class TestDecisionFramework:
    """Test suite for decision framework generation."""
    
    def test_compression_alert_true(self):
        """Test decision framework with compression alert."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": True,
            "compression_percentage": -30.0
        }
        
        action = connector.prepare_workflow_action(results)
        framework = action["decision_framework"]
        
        assert framework["compression_alert"] is True
        assert framework["severity"] == "high"
        assert framework["confidence"] == "high"
    
    def test_compression_alert_false(self):
        """Test decision framework without compression."""
        connector = Workflow9Connector()
        results = {
            "mode": "basic",
            "compression_detected": False
        }
        
        action = connector.prepare_workflow_action(results)
        framework = action["decision_framework"]
        
        assert framework["compression_alert"] is False
        assert framework["severity"] == "low"
    
    def test_severity_assessment_high(self):
        """Test high severity assessment."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": True,
            "compression_percentage": -35.0
        }
        
        action = connector.prepare_workflow_action(results)
        
        assert action["decision_framework"]["severity"] == "high"
        assert action["analysis"]["status"] == "critical"
    
    def test_severity_assessment_medium(self):
        """Test medium severity assessment."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": True,
            "compression_percentage": -25.0
        }
        
        action = connector.prepare_workflow_action(results)
        
        assert action["decision_framework"]["severity"] == "medium"
        assert action["analysis"]["status"] == "alert"
    
    def test_severity_assessment_low(self):
        """Test low severity assessment."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": True,
            "compression_percentage": -15.0
        }
        
        action = connector.prepare_workflow_action(results)
        
        assert action["decision_framework"]["severity"] == "low"
    
    def test_confidence_full_mode(self):
        """Test confidence assessment for full mode."""
        connector = Workflow9Connector()
        results = {"mode": "full"}
        
        action = connector.prepare_workflow_action(results)
        
        assert action["decision_framework"]["confidence"] == "high"
    
    def test_confidence_basic_mode(self):
        """Test confidence assessment for basic mode."""
        connector = Workflow9Connector()
        results = {"mode": "basic"}
        
        action = connector.prepare_workflow_action(results)
        
        assert action["decision_framework"]["confidence"] == "medium"
    
    def test_confidence_offline_mode(self):
        """Test confidence assessment for offline mode."""
        connector = Workflow9Connector()
        results = {"mode": "offline"}
        
        action = connector.prepare_workflow_action(results)
        
        assert action["decision_framework"]["confidence"] == "low"
    
    def test_risk_factors_extraction(self):
        """Test risk factors extraction."""
        connector = Workflow9Connector()
        results = {
            "mode": "offline",
            "limitations": ["Old cached data", "Limited peer comparison"]
        }
        
        action = connector.prepare_workflow_action(results)
        risks = action["decision_framework"]["risk_factors"]
        
        assert len(risks) > 0
        assert any("offline mode" in risk.lower() for risk in risks)
        assert "Old cached data" in risks
        assert "Limited peer comparison" in risks
    
    def test_next_actions_compression(self):
        """Test next actions for compression scenario."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": True
        }
        
        action = connector.prepare_workflow_action(results)
        next_actions = action["decision_framework"]["next_actions"]
        
        assert len(next_actions) > 0
        assert any("earnings" in action.lower() for action in next_actions)
        assert any("cash flow" in action.lower() for action in next_actions)
    
    def test_next_actions_stable(self):
        """Test next actions for stable scenario."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": False
        }
        
        action = connector.prepare_workflow_action(results)
        next_actions = action["decision_framework"]["next_actions"]
        
        assert len(next_actions) > 0
        assert any("monitor" in action.lower() for action in next_actions)


class TestWorkflowActions:
    """Test suite for workflow action generation."""
    
    def test_compression_workflow_actions(self):
        """Test workflow actions generated for compression."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": True,
            "compression_percentage": -25.0
        }
        
        action = connector.prepare_workflow_action(results)
        workflow_actions = action["workflow_actions"]
        
        assert len(workflow_actions) > 0
        
        # Check for high-priority alert
        alert_action = next((a for a in workflow_actions if a["action_type"] == "alert"), None)
        assert alert_action is not None
        assert alert_action["priority"] == "high"
        assert "target_workflow" in alert_action
        
        # Check for research action
        research_action = next((a for a in workflow_actions if a["action_type"] == "research"), None)
        assert research_action is not None
        
        # Check for comparison action
        comparison_action = next((a for a in workflow_actions if a["action_type"] == "comparison"), None)
        assert comparison_action is not None
    
    def test_stable_workflow_actions(self):
        """Test workflow actions for stable scenario."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "compression_detected": False
        }
        
        action = connector.prepare_workflow_action(results)
        workflow_actions = action["workflow_actions"]
        
        assert len(workflow_actions) > 0
        
        # Check for monitor action
        monitor_action = next((a for a in workflow_actions if a["action_type"] == "monitor"), None)
        assert monitor_action is not None
        assert monitor_action["priority"] == "low"
    
    def test_action_structure(self):
        """Test workflow action structure."""
        connector = Workflow9Connector()
        results = {"mode": "full", "compression_detected": True}
        
        action = connector.prepare_workflow_action(results)
        workflow_actions = action["workflow_actions"]
        
        for wf_action in workflow_actions:
            assert "action_type" in wf_action
            assert "priority" in wf_action
            assert "description" in wf_action
            assert "target_workflow" in wf_action


class TestOutputFormatting:
    """Test suite for output formatting."""
    
    def test_json_only_output(self):
        """Test JSON-only output format."""
        connector = Workflow9Connector(output_format="json")
        results = {"mode": "basic", "symbol": "TEST"}
        
        action = connector.prepare_workflow_action(results)
        outputs = action["outputs"]
        
        assert "json" in outputs
        assert "markdown" not in outputs
    
    def test_markdown_only_output(self):
        """Test Markdown-only output format."""
        connector = Workflow9Connector(output_format="markdown")
        results = {"mode": "basic", "symbol": "TEST"}
        
        action = connector.prepare_workflow_action(results)
        outputs = action["outputs"]
        
        assert "markdown" in outputs
        assert "json" not in outputs
    
    def test_both_outputs(self):
        """Test both output formats."""
        connector = Workflow9Connector(output_format="both")
        results = {"mode": "basic", "symbol": "TEST"}
        
        action = connector.prepare_workflow_action(results)
        outputs = action["outputs"]
        
        assert "json" in outputs
        assert "markdown" in outputs
    
    def test_simple_markdown_generation(self):
        """Test simple Markdown generation."""
        connector = Workflow9Connector(output_format="markdown")
        results = {
            "mode": "full",
            "symbol": "AAPL",
            "compression_detected": True
        }
        
        action = connector.prepare_workflow_action(results)
        markdown = action["outputs"]["markdown"]
        
        assert "AAPL" in markdown
        assert "Full" in markdown or "full" in markdown
        assert "Yes" in markdown


class TestValidation:
    """Test suite for input validation."""
    
    def test_validation_with_valid_data(self):
        """Test validation passes with valid data."""
        connector = Workflow9Connector(strict_validation=True)
        results = {"mode": "basic"}
        
        # Should not raise
        action = connector.prepare_workflow_action(results)
        assert action is not None
    
    def test_validation_missing_required_field(self):
        """Test validation fails with missing required field."""
        connector = Workflow9Connector(strict_validation=True)
        results = {}  # Missing 'mode'
        
        with pytest.raises(Workflow9InterfaceError, match="Missing required fields"):
            connector.prepare_workflow_action(results)
    
    def test_validation_non_dict_input(self):
        """Test validation fails with non-dictionary input."""
        connector = Workflow9Connector(strict_validation=True)
        
        with pytest.raises(Workflow9InterfaceError, match="must be a dictionary"):
            connector.prepare_workflow_action("not a dict")
    
    def test_validation_disabled(self):
        """Test validation can be disabled."""
        connector = Workflow9Connector(strict_validation=False)
        results = {}  # Missing 'mode', but validation disabled
        
        # Should not raise
        action = connector.prepare_workflow_action(results)
        assert action is not None
    
    def test_error_log_on_validation_failure(self):
        """Test error log is populated on validation failure."""
        connector = Workflow9Connector(strict_validation=True)
        
        try:
            connector.prepare_workflow_action({})
        except Workflow9InterfaceError:
            pass
        
        errors = connector.get_error_log()
        assert len(errors) > 0
        assert "Missing required fields" in errors[0]
    
    def test_clear_error_log(self):
        """Test error log can be cleared."""
        connector = Workflow9Connector(strict_validation=True)
        
        try:
            connector.prepare_workflow_action({})
        except Workflow9InterfaceError:
            pass
        
        assert len(connector.get_error_log()) > 0
        
        connector.clear_error_log()
        assert len(connector.get_error_log()) == 0


class TestInterfaceSpecification:
    """Test suite for interface specification export."""
    
    def test_export_specification(self):
        """Test interface specification export."""
        connector = Workflow9Connector()
        
        spec = connector.export_interface_specification()
        
        assert spec["interface_version"] == "1.0.0"
        assert spec["skill_id"] == "pe-compression-analysis"
        assert "supported_formats" in spec
        assert "input_contract" in spec
        assert "output_contract" in spec
        assert "workflow_actions" in spec
    
    def test_input_contract(self):
        """Test input contract specification."""
        connector = Workflow9Connector()
        
        spec = connector.export_interface_specification()
        input_contract = spec["input_contract"]
        
        assert "required_fields" in input_contract
        assert "mode" in input_contract["required_fields"]
        assert "optional_fields" in input_contract
    
    def test_output_contract(self):
        """Test output contract specification."""
        connector = Workflow9Connector()
        
        spec = connector.export_interface_specification()
        output_contract = spec["output_contract"]
        
        assert "sections" in output_contract
        expected_sections = ["metadata", "analysis", "decision_framework",
                           "workflow_actions", "outputs"]
        for section in expected_sections:
            assert section in output_contract["sections"]
    
    def test_workflow_actions_spec(self):
        """Test workflow actions specification."""
        connector = Workflow9Connector()
        
        spec = connector.export_interface_specification()
        workflow_actions = spec["workflow_actions"]
        
        assert len(workflow_actions) > 0
        for action in workflow_actions:
            assert "type" in action
            assert "description" in action


class TestIntegration:
    """Integration tests for complete workflow."""
    
    def test_complete_compression_workflow(self):
        """Test complete workflow for compression scenario."""
        connector = Workflow9Connector()
        results = {
            "mode": "full",
            "symbol": "AAPL",
            "compression_detected": True,
            "compression_percentage": -28.0,
            "current_pe": 22.0,
            "historical_pe": 30.0,
            "industry_average": 28.0,
            "analysis": "Significant compression detected",
            "recommendations": ["Review fundamentals", "Check news"],
            "limitations": []
        }
        markdown = "# Test Markdown"
        
        action = connector.prepare_workflow_action(results, markdown_output=markdown)
        
        # Verify all sections present
        assert "metadata" in action
        assert "analysis" in action
        assert "decision_framework" in action
        assert "workflow_actions" in action
        assert "outputs" in action
        
        # Verify compression handling
        assert action["analysis"]["status"] == "alert"
        assert action["decision_framework"]["severity"] == "medium"
        assert action["decision_framework"]["compression_alert"] is True
        
        # Verify workflow actions generated
        assert len(action["workflow_actions"]) > 2
        
        # Verify outputs
        assert "json" in action["outputs"]
        assert "markdown" in action["outputs"]
        assert action["outputs"]["markdown"] == markdown
    
    def test_complete_stable_workflow(self):
        """Test complete workflow for stable scenario."""
        connector = Workflow9Connector(output_format="json")
        results = {
            "mode": "basic",
            "symbol": "GOOGL",
            "compression_detected": False,
            "compression_percentage": -3.0,
            "current_pe": 25.0,
            "historical_pe": 24.5
        }
        
        action = connector.prepare_workflow_action(results)
        
        # Verify normal status
        assert action["analysis"]["status"] == "normal"
        assert action["decision_framework"]["severity"] == "low"
        assert action["decision_framework"]["compression_alert"] is False
        
        # Verify monitoring actions
        workflow_actions = action["workflow_actions"]
        assert len(workflow_actions) > 0
        assert any(a["action_type"] == "monitor" for a in workflow_actions)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

