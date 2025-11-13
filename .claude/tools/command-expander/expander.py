"""
Command Template Expander

Expands command templates using Jinja2 with variable substitution and validation.
"""

import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from jinja2 import Environment, BaseLoader, TemplateSyntaxError, UndefinedError
from dataclasses import dataclass

from template_loader import Template, VariableSpec

logger = logging.getLogger(__name__)


@dataclass
class ExpansionResult:
    """Result of template expansion."""
    command: str
    template_name: str
    variables_used: Dict[str, Any]
    success: bool
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


class CommandExpander:
    """
    Expands command templates using Jinja2.
    
    Features:
    - Variable substitution with type checking
    - Default value handling
    - Pattern validation
    - Option constraints
    - Error reporting
    """
    
    def __init__(self):
        """Initialize the command expander."""
        # Create Jinja2 environment
        self.env = Environment(
            loader=BaseLoader(),
            autoescape=False,  # Don't escape for shell commands
            variable_start_string='{{',
            variable_end_string='}}',
            trim_blocks=True,
            lstrip_blocks=True
        )
    
    def expand(
        self,
        template: Template,
        variables: Optional[Dict[str, Any]] = None
    ) -> ExpansionResult:
        """
        Expand a template with provided variables.
        
        Args:
            template: Template to expand
            variables: Dictionary of variable values
        
        Returns:
            ExpansionResult with expanded command or errors
        """
        if variables is None:
            variables = {}
        
        # Validate and process variables
        processed_vars, errors, warnings = self._process_variables(
            template.variables,
            variables
        )
        
        if errors:
            return ExpansionResult(
                command="",
                template_name=template.name,
                variables_used=variables,
                success=False,
                errors=errors,
                warnings=warnings
            )
        
        # Expand template
        try:
            jinja_template = self.env.from_string(template.command)
            expanded_command = jinja_template.render(**processed_vars)
            
            return ExpansionResult(
                command=expanded_command,
                template_name=template.name,
                variables_used=processed_vars,
                success=True,
                errors=[],
                warnings=warnings
            )
        
        except TemplateSyntaxError as e:
            return ExpansionResult(
                command="",
                template_name=template.name,
                variables_used=variables,
                success=False,
                errors=[f"Template syntax error: {e}"],
                warnings=warnings
            )
        
        except UndefinedError as e:
            return ExpansionResult(
                command="",
                template_name=template.name,
                variables_used=variables,
                success=False,
                errors=[f"Undefined variable: {e}"],
                warnings=warnings
            )
        
        except Exception as e:
            return ExpansionResult(
                command="",
                template_name=template.name,
                variables_used=variables,
                success=False,
                errors=[f"Expansion error: {e}"],
                warnings=warnings
            )
    
    def _process_variables(
        self,
        var_specs: List[VariableSpec],
        provided_vars: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[str], List[str]]:
        """
        Process and validate variables against specifications.
        
        Args:
            var_specs: List of variable specifications
            provided_vars: Dictionary of provided variable values
        
        Returns:
            Tuple of (processed_variables, errors, warnings)
        """
        processed = {}
        errors = []
        warnings = []
        
        # Check each variable specification
        for var_spec in var_specs:
            var_name = var_spec.name
            
            # Check if variable was provided
            if var_name in provided_vars:
                value = provided_vars[var_name]
                
                # Validate and convert type
                converted_value, type_error = self._validate_and_convert_type(
                    value, var_spec
                )
                
                if type_error:
                    errors.append(type_error)
                    continue
                
                # Validate against pattern
                if var_spec.pattern:
                    pattern_error = self._validate_pattern(
                        converted_value, var_spec.pattern, var_name
                    )
                    if pattern_error:
                        errors.append(pattern_error)
                        continue
                
                # Validate against options
                if var_spec.options:
                    option_error = self._validate_options(
                        converted_value, var_spec.options, var_name
                    )
                    if option_error:
                        errors.append(option_error)
                        continue
                
                # Validate min/max for numbers
                if var_spec.type in ['integer', 'float']:
                    range_error = self._validate_range(
                        converted_value, var_spec.min, var_spec.max, var_name
                    )
                    if range_error:
                        errors.append(range_error)
                        continue
                
                processed[var_name] = converted_value
            
            # Variable not provided - check if required or has default
            elif var_spec.required:
                errors.append(f"Required variable '{var_name}' not provided")
            
            elif var_spec.default is not None:
                processed[var_name] = var_spec.default
                warnings.append(
                    f"Using default value for '{var_name}': {var_spec.default}"
                )
            
            else:
                # Optional variable without default - skip it
                warnings.append(
                    f"Optional variable '{var_name}' not provided (no default)"
                )
        
        return processed, errors, warnings
    
    def _validate_and_convert_type(
        self,
        value: Any,
        var_spec: VariableSpec
    ) -> Tuple[Any, Optional[str]]:
        """
        Validate and convert variable value to expected type.
        
        Args:
            value: Raw value
            var_spec: Variable specification
        
        Returns:
            Tuple of (converted_value, error_message)
        """
        var_name = var_spec.name
        expected_type = var_spec.type
        
        # String type
        if expected_type == 'string':
            if not isinstance(value, str):
                try:
                    return str(value), None
                except Exception:
                    return None, f"Cannot convert '{var_name}' to string"
            return value, None
        
        # Integer type
        elif expected_type == 'integer':
            if isinstance(value, bool):
                return None, f"Variable '{var_name}' should be integer, got boolean"
            if isinstance(value, int):
                return value, None
            try:
                return int(value), None
            except (ValueError, TypeError):
                return None, f"Variable '{var_name}' must be an integer"
        
        # Float type
        elif expected_type == 'float':
            if isinstance(value, bool):
                return None, f"Variable '{var_name}' should be float, got boolean"
            if isinstance(value, (int, float)):
                return float(value), None
            try:
                return float(value), None
            except (ValueError, TypeError):
                return None, f"Variable '{var_name}' must be a number"
        
        # Boolean type
        elif expected_type == 'boolean':
            if isinstance(value, bool):
                return value, None
            # Try to convert string representations
            if isinstance(value, str):
                lower_value = value.lower()
                if lower_value in ['true', 'yes', '1', 'on']:
                    return True, None
                elif lower_value in ['false', 'no', '0', 'off']:
                    return False, None
            return None, f"Variable '{var_name}' must be a boolean"
        
        else:
            return None, f"Unknown type '{expected_type}' for variable '{var_name}'"
    
    def _validate_pattern(
        self,
        value: Any,
        pattern: str,
        var_name: str
    ) -> Optional[str]:
        """
        Validate value against regex pattern.
        
        Args:
            value: Value to validate
            pattern: Regex pattern
            var_name: Variable name (for error messages)
        
        Returns:
            Error message or None if valid
        """
        try:
            if not re.match(pattern, str(value)):
                return f"Variable '{var_name}' does not match pattern: {pattern}"
        except re.error as e:
            return f"Invalid regex pattern for '{var_name}': {e}"
        
        return None
    
    def _validate_options(
        self,
        value: Any,
        options: List[str],
        var_name: str
    ) -> Optional[str]:
        """
        Validate value is in allowed options list.
        
        Args:
            value: Value to validate
            options: List of allowed values
            var_name: Variable name (for error messages)
        
        Returns:
            Error message or None if valid
        """
        if str(value) not in [str(opt) for opt in options]:
            return (
                f"Variable '{var_name}' must be one of: {', '.join(map(str, options))}. "
                f"Got: {value}"
            )
        return None
    
    def _validate_range(
        self,
        value: Any,
        min_val: Optional[int],
        max_val: Optional[int],
        var_name: str
    ) -> Optional[str]:
        """
        Validate numeric value is within min/max range.
        
        Args:
            value: Numeric value
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            var_name: Variable name (for error messages)
        
        Returns:
            Error message or None if valid
        """
        if min_val is not None and value < min_val:
            return f"Variable '{var_name}' must be >= {min_val}. Got: {value}"
        
        if max_val is not None and value > max_val:
            return f"Variable '{var_name}' must be <= {max_val}. Got: {value}"
        
        return None
    
    def preview(
        self,
        template: Template,
        variables: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate a preview of the expanded command (dry-run).
        
        Args:
            template: Template to preview
            variables: Dictionary of variable values
        
        Returns:
            Preview string with explanation
        """
        result = self.expand(template, variables)
        
        preview_lines = [
            f"Template: {template.name}",
            f"Description: {template.description}",
            ""
        ]
        
        if result.success:
            preview_lines.extend([
                "✓ Expansion successful",
                "",
                "Command:",
                f"  {result.command}",
                "",
                "Variables used:"
            ])
            for var_name, var_value in result.variables_used.items():
                preview_lines.append(f"  {var_name} = {var_value}")
            
            if result.warnings:
                preview_lines.extend(["", "Warnings:"])
                for warning in result.warnings:
                    preview_lines.append(f"  ⚠️  {warning}")
        
        else:
            preview_lines.extend([
                "✗ Expansion failed",
                "",
                "Errors:"
            ])
            for error in result.errors:
                preview_lines.append(f"  ✗ {error}")
            
            if result.warnings:
                preview_lines.extend(["", "Warnings:"])
                for warning in result.warnings:
                    preview_lines.append(f"  ⚠️  {warning}")
        
        return "\n".join(preview_lines)


# ===== Convenience functions =====

def expand_template(
    template: Template,
    variables: Optional[Dict[str, Any]] = None
) -> ExpansionResult:
    """
    Expand a template with variables (convenience function).
    
    Args:
        template: Template to expand
        variables: Dictionary of variable values
    
    Returns:
        ExpansionResult
    """
    expander = CommandExpander()
    return expander.expand(template, variables)


def preview_template(
    template: Template,
    variables: Optional[Dict[str, Any]] = None
) -> str:
    """
    Preview template expansion (convenience function).
    
    Args:
        template: Template to preview
        variables: Dictionary of variable values
    
    Returns:
        Preview string
    """
    expander = CommandExpander()
    return expander.preview(template, variables)

