"""
Interactive Prompts

Provides interactive variable input.
Note: Uses built-in input() for now. Can be enhanced with prompt_toolkit later.
"""

from typing import Dict, Any, Optional, List, Tuple
import re

from template_loader import VariableSpec


def validate_input(text: str, var_spec: VariableSpec) -> Tuple[bool, Optional[str]]:
    """
    Validate input against variable specification.
    
    Args:
        text: Input text
        var_spec: Variable specification
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    text = text.strip()
    
    if not text and var_spec.required:
        return False, 'This variable is required'
    
    if not text:
        return True, None  # Optional variable, empty is ok
    
    # Type validation
    if var_spec.type == 'integer':
        try:
            int(text)
        except ValueError:
            return False, 'Must be a valid integer'
    
    elif var_spec.type == 'float':
        try:
            float(text)
        except ValueError:
            return False, 'Must be a valid number'
    
    elif var_spec.type == 'boolean':
        if text.lower() not in ['true', 'false', 'yes', 'no', '1', '0', 'on', 'off']:
            return False, 'Must be true/false'
    
    # Pattern validation
    if var_spec.pattern:
        if not re.match(var_spec.pattern, text):
            return False, f'Must match pattern: {var_spec.pattern}'
    
    # Options validation
    if var_spec.options:
        if text not in [str(opt) for opt in var_spec.options]:
            return False, f'Must be one of: {", ".join(map(str, var_spec.options))}'
    
    return True, None


def prompt_for_variables(
    variables: List[VariableSpec],
    existing_values: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Interactively prompt for variable values.
    
    Args:
        variables: List of variable specifications
        existing_values: Pre-filled values to skip prompting for
    
    Returns:
        Dictionary of variable values
    """
    if existing_values is None:
        existing_values = {}
    
    result = {}
    
    for var_spec in variables:
        # Skip if already provided
        if var_spec.name in existing_values:
            result[var_spec.name] = existing_values[var_spec.name]
            continue
        
        # Skip optional variables without defaults
        if not var_spec.required and var_spec.default is None:
            skip = prompt(
                f"\nPrompt for optional variable '{var_spec.name}'? [y/N]: ",
                default='n'
            ).strip().lower()
            
            if skip not in ['y', 'yes']:
                continue
        
        # Build prompt message
        prompt_msg = f"\n{var_spec.name}"
        if var_spec.description:
            prompt_msg += f" - {var_spec.description}"
        
        # Add constraints info
        constraints = []
        if var_spec.required:
            constraints.append("required")
        if var_spec.options:
            constraints.append(f"options: {', '.join(map(str, var_spec.options))}")
        if var_spec.pattern:
            constraints.append(f"pattern: {var_spec.pattern}")
        if var_spec.min is not None or var_spec.max is not None:
            range_str = f"range: {var_spec.min or '∞'}-{var_spec.max or '∞'}"
            constraints.append(range_str)
        
        if constraints:
            prompt_msg += f" ({', '.join(constraints)})"
        
        # Default value
        default_value = ""
        if var_spec.default is not None:
            default_value = str(var_spec.default)
            prompt_msg += f"\n  [default: {default_value}]: "
        else:
            prompt_msg += ": "
        
        # Prompt loop with validation
        while True:
            try:
                value = input(prompt_msg).strip()
                
                # Use default if empty
                if not value:
                    if var_spec.default is not None:
                        value = str(var_spec.default)
                    elif not var_spec.required:
                        break  # Skip optional
                    else:
                        print("  ✗ This variable is required")
                        continue
                
                # Validate input
                is_valid, error_msg = validate_input(value, var_spec)
                if not is_valid:
                    print(f"  ✗ {error_msg}")
                    continue
                
                # Type conversion
                if var_spec.type == 'integer':
                    value = int(value)
                elif var_spec.type == 'float':
                    value = float(value)
                elif var_spec.type == 'boolean':
                    value = value.lower() in ['true', 'yes', '1', 'on']
                
                result[var_spec.name] = value
                break
            
            except KeyboardInterrupt:
                print("\n\nCancelled by user.")
                raise
            except EOFError:
                print("\n\nInput ended.")
                break
    
    return result

