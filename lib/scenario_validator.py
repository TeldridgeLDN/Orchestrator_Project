#!/usr/bin/env python3
"""
Scenario YAML Schema Validator
Partnership-Enabled Scenario System - Task 67

Validates scenario YAML files against the comprehensive schema.
"""

import yaml
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from jsonschema import validate, ValidationError, Draft7Validator
from datetime import datetime


class ScenarioValidator:
    """Validates scenario YAML files against the schema."""
    
    # Comprehensive JSON Schema for scenarios
    SCHEMA = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Scenario Definition Schema",
        "type": "object",
        "required": ["scenario"],
        "properties": {
            "scenario": {
                "type": "object",
                "required": ["name", "description", "version", "trigger", "steps"],
                "properties": {
                    "name": {
                        "type": "string",
                        "pattern": "^[a-z0-9_]+$",
                        "minLength": 3,
                        "maxLength": 50,
                        "description": "Scenario identifier (lowercase, underscores)"
                    },
                    "description": {
                        "type": "string",
                        "minLength": 10,
                        "maxLength": 500
                    },
                    "version": {
                        "type": "string",
                        "pattern": "^\\d+\\.\\d+\\.\\d+$",
                        "description": "Semantic version (e.g., 1.0.0)"
                    },
                    "partnership_level": {
                        "type": "string",
                        "enum": ["basic", "consultative", "partner"],
                        "default": "consultative"
                    },
                    "trigger": {
                        "type": "object",
                        "required": ["type"],
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["manual", "command", "webhook", "schedule", "hybrid"]
                            },
                            "command": {"type": "string"},
                            "webhook_path": {"type": "string"},
                            "schedule": {"type": "string"}
                        }
                    },
                    "steps": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                            "type": "object",
                            "required": ["id", "name", "action", "target"],
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string", "minLength": 3},
                                "action": {
                                    "type": "string",
                                    "enum": ["skill", "command", "hook", "mcp", "agent"]
                                },
                                "target": {"type": "string"},
                                "inputs": {"type": "array", "items": {"type": "string"}},
                                "outputs": {"type": "array", "items": {"type": "string"}},
                                "depends_on": {"type": "array", "items": {"type": "string"}},
                                "condition": {"type": "string"},
                                "error_handling": {
                                    "type": "object",
                                    "properties": {
                                        "retry": {"type": "integer", "minimum": 0},
                                        "fallback": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "outputs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["name", "type"],
                            "properties": {
                                "name": {"type": "string"},
                                "type": {"type": "string"},
                                "destination": {"type": "string"}
                            }
                        }
                    },
                    "design_decisions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["decision", "reasoning"],
                            "properties": {
                                "decision": {"type": "string"},
                                "reasoning": {"type": "string"},
                                "alternatives_considered": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "trade_offs": {"type": "string"}
                            }
                        }
                    },
                    "potential_improvements": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["suggestion", "impact", "complexity"],
                            "properties": {
                                "suggestion": {"type": "string"},
                                "impact": {"type": "string", "enum": ["low", "medium", "high"]},
                                "complexity": {"type": "string", "enum": ["low", "medium", "high"]},
                                "priority": {"type": "string", "enum": ["low", "medium", "high"]}
                            }
                        }
                    }
                }
            }
        }
    }
    
    def __init__(self):
        """Initialize validator."""
        self.validator = Draft7Validator(self.SCHEMA)
    
    def validate_yaml_file(self, file_path: Path) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Validate a scenario YAML file.
        
        Args:
            file_path: Path to YAML file
            
        Returns:
            Tuple of (is_valid, errors)
        """
        try:
            with open(file_path, 'r') as f:
                data = yaml.safe_load(f)
            
            return self.validate_data(data)
        except yaml.YAMLError as e:
            return False, [{
                "field": "file",
                "message": f"YAML parsing error: {str(e)}",
                "suggestion": "Check YAML syntax (indentation, colons, hyphens)"
            }]
        except Exception as e:
            return False, [{
                "field": "file",
                "message": f"File error: {str(e)}",
                "suggestion": "Ensure file exists and is readable"
            }]
    
    def validate_data(self, data: Dict[str, Any]) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Validate scenario data dictionary.
        
        Args:
            data: Parsed YAML data
            
        Returns:
            Tuple of (is_valid, errors)
        """
        errors = []
        
        # Run JSON Schema validation
        for error in self.validator.iter_errors(data):
            formatted_error = self._format_error(error)
            errors.append(formatted_error)
        
        # Custom validations
        if not errors and "scenario" in data:
            errors.extend(self._validate_step_dependencies(data["scenario"]))
            errors.extend(self._validate_trigger_config(data["scenario"]))
        
        return len(errors) == 0, errors
    
    def _format_error(self, error: ValidationError) -> Dict[str, Any]:
        """Format jsonschema error with helpful message."""
        path = ".".join(str(p) for p in error.path) if error.path else "root"
        
        # Generate helpful suggestions
        suggestion = ""
        if error.validator == "required":
            missing = error.message.split("'")[1]
            suggestion = f"Add the required '{missing}' field"
        elif error.validator == "enum":
            allowed = error.validator_value
            suggestion = f"Use one of: {', '.join(allowed)}"
        elif error.validator == "pattern":
            if "name" in path:
                suggestion = "Use lowercase letters, numbers, and underscores only"
            elif "version" in path:
                suggestion = "Use semantic versioning format (e.g., 1.0.0)"
        elif error.validator == "minLength":
            suggestion = f"Minimum length is {error.validator_value} characters"
        elif error.validator == "minItems":
            suggestion = f"Add at least {error.validator_value} item(s)"
        
        return {
            "field": path,
            "message": error.message,
            "suggestion": suggestion,
            "value": error.instance if not isinstance(error.instance, (dict, list)) else str(type(error.instance))
        }
    
    def _validate_step_dependencies(self, scenario: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Validate that step dependencies reference existing steps."""
        errors = []
        steps = scenario.get("steps", [])
        step_ids = {step.get("id") for step in steps}
        
        for i, step in enumerate(steps):
            depends_on = step.get("depends_on", [])
            for dep_id in depends_on:
                if dep_id not in step_ids:
                    errors.append({
                        "field": f"scenario.steps.{i}.depends_on",
                        "message": f"Dependency '{dep_id}' not found in steps",
                        "suggestion": f"Valid step IDs: {', '.join(step_ids)}"
                    })
        
        return errors
    
    def _validate_trigger_config(self, scenario: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Validate trigger configuration completeness."""
        errors = []
        trigger = scenario.get("trigger", {})
        trigger_type = trigger.get("type")
        
        if trigger_type == "command" and not trigger.get("command"):
            errors.append({
                "field": "scenario.trigger.command",
                "message": "Command trigger requires 'command' field",
                "suggestion": "Add 'command: \"/your-command\"' to trigger"
            })
        elif trigger_type == "webhook" and not trigger.get("webhook_path"):
            errors.append({
                "field": "scenario.trigger.webhook_path",
                "message": "Webhook trigger requires 'webhook_path' field",
                "suggestion": "Add 'webhook_path: \"/hooks/your-path\"' to trigger"
            })
        elif trigger_type == "schedule" and not trigger.get("schedule"):
            errors.append({
                "field": "scenario.trigger.schedule",
                "message": "Schedule trigger requires 'schedule' field",
                "suggestion": "Add 'schedule: \"0 9 * * *\"' (cron format) to trigger"
            })
        
        return errors
    
    def format_validation_report(
        self,
        file_path: Path,
        is_valid: bool,
        errors: List[Dict[str, Any]]
    ) -> str:
        """Format validation results as a readable report."""
        report = []
        report.append("=" * 70)
        report.append("  Scenario Validation Report")
        report.append("=" * 70)
        report.append(f"\nFile: {file_path}")
        report.append(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if is_valid:
            report.append("\n✅ Validation PASSED - Scenario is valid!\n")
            report.append("Summary:")
            report.append("  - All required fields present")
            report.append("  - All field types correct")
            report.append("  - All dependencies valid")
        else:
            report.append(f"\n❌ Validation FAILED - {len(errors)} error(s) found\n")
            
            # Group errors by type
            required_errors = [e for e in errors if "required" in e["message"].lower()]
            type_errors = [e for e in errors if "type" in e["message"].lower() or "enum" in e["field"]]
            dep_errors = [e for e in errors if "depend" in e["message"].lower()]
            other_errors = [e for e in errors if e not in required_errors + type_errors + dep_errors]
            
            if required_errors:
                report.append("🔴 Missing Required Fields:\n")
                for i, error in enumerate(required_errors, 1):
                    report.append(f"{i}. {error['field']}")
                    report.append(f"   ❌ {error['message']}")
                    if error.get('suggestion'):
                        report.append(f"   💡 {error['suggestion']}")
                    report.append("")
            
            if type_errors:
                report.append("⚠️  Type/Value Errors:\n")
                for i, error in enumerate(type_errors, 1):
                    report.append(f"{i}. {error['field']}")
                    report.append(f"   ❌ {error['message']}")
                    if error.get('suggestion'):
                        report.append(f"   💡 {error['suggestion']}")
                    report.append("")
            
            if dep_errors:
                report.append("🔗 Dependency Errors:\n")
                for i, error in enumerate(dep_errors, 1):
                    report.append(f"{i}. {error['field']}")
                    report.append(f"   ❌ {error['message']}")
                    if error.get('suggestion'):
                        report.append(f"   💡 {error['suggestion']}")
                    report.append("")
            
            if other_errors:
                report.append("⚠️  Other Issues:\n")
                for i, error in enumerate(other_errors, 1):
                    report.append(f"{i}. {error['field']}")
                    report.append(f"   ❌ {error['message']}")
                    if error.get('suggestion'):
                        report.append(f"   💡 {error['suggestion']}")
                    report.append("")
            
            report.append("💡 Quick Fixes:")
            report.append("  1. Check for required fields marked with ❌")
            report.append("  2. Verify data types (string, array, object)")
            report.append("  3. Ensure enum values match allowed options")
            report.append("  4. Review suggestions (💡) for each error")
        
        report.append("=" * 70)
        return "\n".join(report)


def validate_scenario_cli(file_path: str):
    """CLI interface for scenario validation."""
    validator = ScenarioValidator()
    path = Path(file_path)
    
    is_valid, errors = validator.validate_yaml_file(path)
    report = validator.format_validation_report(path, is_valid, errors)
    
    print(report)
    return 0 if is_valid else 1


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python scenario_validator.py <scenario.yaml>")
        sys.exit(1)
    
    sys.exit(validate_scenario_cli(sys.argv[1]))

