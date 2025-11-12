"""
Unit tests for scenario validator - Task 67
"""

import pytest
import yaml
from pathlib import Path
from lib.scenario_validator import ScenarioValidator


@pytest.fixture
def validator():
    """Create validator instance."""
    return ScenarioValidator()


@pytest.fixture
def valid_scenario():
    """Valid scenario data."""
    return {
        "scenario": {
            "name": "test_workflow",
            "description": "A test workflow for validation",
            "version": "1.0.0",
            "partnership_level": "consultative",
            "trigger": {
                "type": "manual"
            },
            "steps": [
                {
                    "id": "step1",
                    "name": "First Step",
                    "action": "skill",
                    "target": "test_skill"
                }
            ]
        }
    }


def test_valid_scenario(validator, valid_scenario):
    """Test validation of valid scenario."""
    is_valid, errors = validator.validate_data(valid_scenario)
    assert is_valid
    assert len(errors) == 0


def test_missing_required_field(validator):
    """Test detection of missing required fields."""
    data = {
        "scenario": {
            "name": "test",
            "description": "Test scenario",
            # Missing version
            "trigger": {"type": "manual"},
            "steps": []
        }
    }
    is_valid, errors = validator.validate_data(data)
    assert not is_valid
    assert any("version" in e["message"].lower() for e in errors)


def test_invalid_name_pattern(validator):
    """Test detection of invalid name pattern."""
    data = {
        "scenario": {
            "name": "Invalid-Name",  # Should be lowercase with underscores
            "description": "Test scenario",
            "version": "1.0.0",
            "trigger": {"type": "manual"},
            "steps": []
        }
    }
    is_valid, errors = validator.validate_data(data)
    assert not is_valid


def test_invalid_partnership_level(validator):
    """Test detection of invalid partnership level."""
    data = {
        "scenario": {
            "name": "test_workflow",
            "description": "Test scenario",
            "version": "1.0.0",
            "partnership_level": "invalid",  # Not in enum
            "trigger": {"type": "manual"},
            "steps": []
        }
    }
    is_valid, errors = validator.validate_data(data)
    assert not is_valid


def test_step_dependency_validation(validator):
    """Test validation of step dependencies."""
    data = {
        "scenario": {
            "name": "test_workflow",
            "description": "Test scenario",
            "version": "1.0.0",
            "trigger": {"type": "manual"},
            "steps": [
                {
                    "id": "step1",
                    "name": "First",
                    "action": "skill",
                    "target": "test",
                    "depends_on": ["nonexistent"]  # Invalid dependency
                }
            ]
        }
    }
    is_valid, errors = validator.validate_data(data)
    assert not is_valid
    assert any("dependency" in e["message"].lower() for e in errors)


def test_trigger_validation(validator):
    """Test trigger configuration validation."""
    data = {
        "scenario": {
            "name": "test_workflow",
            "description": "Test scenario",
            "version": "1.0.0",
            "trigger": {
                "type": "command"
                # Missing required 'command' field
            },
            "steps": [
                {
                    "id": "step1",
                    "name": "Test Step",
                    "action": "skill",
                    "target": "test"
                }
            ]
        }
    }
    is_valid, errors = validator.validate_data(data)
    assert not is_valid
    # Check that trigger validation error was raised
    assert any("command" in e["message"].lower() or "trigger.command" in e["field"] for e in errors)


def test_error_formatting(validator):
    """Test error message formatting."""
    data = {"scenario": {"name": "a"}}  # Multiple errors
    is_valid, errors = validator.validate_data(data)
    
    assert not is_valid
    for error in errors:
        assert "field" in error
        assert "message" in error
        # Most errors should have suggestions
        if error["field"] != "scenario":
            assert "suggestion" in error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

