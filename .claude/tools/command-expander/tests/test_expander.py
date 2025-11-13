"""
Comprehensive test suite for expander.py

Tests cover:
- Basic template expansion
- Variable substitution (string, integer, boolean, float)
- Default value handling
- Type validation and conversion
- Pattern validation (regex)
- Options validation (enum constraints)
- Range validation (min/max)
- Required variable checking
- Error handling and reporting
- Warning generation
- Preview functionality
"""

import pytest
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from expander import (
    CommandExpander,
    ExpansionResult,
    expand_template,
    preview_template
)
from template_loader import Template, VariableSpec


# ===== Fixtures =====

@pytest.fixture
def simple_template():
    """Simple template with one required variable"""
    return Template(
        name="echo",
        command="echo '{{ message }}'",
        description="Echo a message",
        variables=[
            VariableSpec(
                name="message",
                type="string",
                required=True,
                description="Message to echo"
            )
        ]
    )


@pytest.fixture
def template_with_defaults():
    """Template with default values"""
    return Template(
        name="server",
        command="python -m http.server {{ port }} --bind {{ host }}",
        description="Start HTTP server",
        variables=[
            VariableSpec(
                name="port",
                type="integer",
                required=False,
                default=8080,
                description="Port number"
            ),
            VariableSpec(
                name="host",
                type="string",
                required=False,
                default="localhost",
                description="Host to bind to"
            )
        ]
    )


@pytest.fixture
def template_with_options():
    """Template with option constraints"""
    return Template(
        name="deploy",
        command="deploy --env {{ environment }} --region {{ region }}",
        description="Deploy to environment",
        variables=[
            VariableSpec(
                name="environment",
                type="string",
                required=True,
                options=["dev", "staging", "prod"],
                description="Target environment"
            ),
            VariableSpec(
                name="region",
                type="string",
                required=False,
                default="us-east-1",
                options=["us-east-1", "us-west-2", "eu-west-1"],
                description="AWS region"
            )
        ]
    )


@pytest.fixture
def template_with_pattern():
    """Template with regex pattern validation"""
    return Template(
        name="version",
        command="git tag {{ version }}",
        description="Create version tag",
        variables=[
            VariableSpec(
                name="version",
                type="string",
                required=True,
                pattern=r'^\d+\.\d+\.\d+$',
                description="Semantic version (x.y.z)"
            )
        ]
    )


@pytest.fixture
def template_with_range():
    """Template with min/max validation"""
    return Template(
        name="allocate",
        command="allocate --memory {{ memory }} --cpu {{ cpu }}",
        description="Allocate resources",
        variables=[
            VariableSpec(
                name="memory",
                type="integer",
                required=True,
                min=512,
                max=16384,
                description="Memory in MB"
            ),
            VariableSpec(
                name="cpu",
                type="float",
                required=True,
                min=0.5,
                max=8.0,
                description="CPU cores"
            )
        ]
    )


@pytest.fixture
def complex_template():
    """Complex template with multiple variable types"""
    return Template(
        name="test-run",
        command="pytest {{ path }} --cov={{ coverage }} -{{ 'v' if verbose else 'q' }} --workers={{ workers }}",
        description="Run tests",
        variables=[
            VariableSpec(
                name="path",
                type="string",
                required=False,
                default="tests/",
                description="Test path"
            ),
            VariableSpec(
                name="coverage",
                type="string",
                required=False,
                default="src/",
                description="Coverage path"
            ),
            VariableSpec(
                name="verbose",
                type="boolean",
                required=False,
                default=True,
                description="Verbose output"
            ),
            VariableSpec(
                name="workers",
                type="integer",
                required=False,
                default=4,
                min=1,
                max=16,
                description="Number of workers"
            )
        ]
    )


# ===== Basic Expansion Tests =====

def test_simple_expansion(simple_template):
    """Test basic template expansion with required variable"""
    expander = CommandExpander()
    result = expander.expand(simple_template, {"message": "Hello World"})
    
    assert result.success == True
    assert result.command == "echo 'Hello World'"
    assert result.errors == []
    assert result.variables_used == {"message": "Hello World"}


def test_expansion_missing_required_variable(simple_template):
    """Test expansion fails when required variable is missing"""
    expander = CommandExpander()
    result = expander.expand(simple_template, {})
    
    assert result.success == False
    assert len(result.errors) > 0
    assert "message" in result.errors[0].lower()
    assert "required" in result.errors[0].lower()


def test_expansion_with_defaults(template_with_defaults):
    """Test expansion uses default values when variables not provided"""
    expander = CommandExpander()
    result = expander.expand(template_with_defaults, {})
    
    assert result.success == True
    assert result.command == "python -m http.server 8080 --bind localhost"
    assert result.variables_used["port"] == 8080
    assert result.variables_used["host"] == "localhost"
    assert len(result.warnings) == 2  # Both used defaults


def test_expansion_override_defaults(template_with_defaults):
    """Test provided values override defaults"""
    expander = CommandExpander()
    result = expander.expand(
        template_with_defaults,
        {"port": 3000, "host": "0.0.0.0"}
    )
    
    assert result.success == True
    assert result.command == "python -m http.server 3000 --bind 0.0.0.0"
    assert result.variables_used["port"] == 3000
    assert result.variables_used["host"] == "0.0.0.0"


# ===== Type Validation Tests =====

def test_string_type_conversion():
    """Test string type conversion"""
    template = Template(
        name="test",
        command="echo {{ value }}",
        description="Test",
        variables=[VariableSpec(name="value", type="string", required=True, description="")]
    )
    
    expander = CommandExpander()
    
    # String stays string
    result = expander.expand(template, {"value": "hello"})
    assert result.success == True
    assert result.variables_used["value"] == "hello"
    
    # Number converts to string
    result = expander.expand(template, {"value": 123})
    assert result.success == True
    assert result.variables_used["value"] == "123"


def test_integer_type_validation():
    """Test integer type validation and conversion"""
    template = Template(
        name="test",
        command="echo {{ count }}",
        description="Test",
        variables=[VariableSpec(name="count", type="integer", required=True, description="")]
    )
    
    expander = CommandExpander()
    
    # Integer accepted
    result = expander.expand(template, {"count": 42})
    assert result.success == True
    assert result.variables_used["count"] == 42
    
    # String integer converts
    result = expander.expand(template, {"count": "42"})
    assert result.success == True
    assert result.variables_used["count"] == 42
    
    # Boolean rejected
    result = expander.expand(template, {"count": True})
    assert result.success == False
    assert "boolean" in result.errors[0].lower()
    
    # Invalid string rejected
    result = expander.expand(template, {"count": "not-a-number"})
    assert result.success == False
    assert "integer" in result.errors[0].lower()


def test_float_type_validation():
    """Test float type validation and conversion"""
    template = Template(
        name="test",
        command="echo {{ value }}",
        description="Test",
        variables=[VariableSpec(name="value", type="float", required=True, description="")]
    )
    
    expander = CommandExpander()
    
    # Float accepted
    result = expander.expand(template, {"value": 3.14})
    assert result.success == True
    assert result.variables_used["value"] == 3.14
    
    # Integer converts to float
    result = expander.expand(template, {"value": 42})
    assert result.success == True
    assert result.variables_used["value"] == 42.0
    
    # String number converts
    result = expander.expand(template, {"value": "3.14"})
    assert result.success == True
    assert abs(result.variables_used["value"] - 3.14) < 0.01


def test_boolean_type_validation():
    """Test boolean type validation and conversion"""
    template = Template(
        name="test",
        command="echo {{ flag }}",
        description="Test",
        variables=[VariableSpec(name="flag", type="boolean", required=True, description="")]
    )
    
    expander = CommandExpander()
    
    # Boolean accepted
    result = expander.expand(template, {"flag": True})
    assert result.success == True
    assert result.variables_used["flag"] == True
    
    # String "true" converts
    result = expander.expand(template, {"flag": "true"})
    assert result.success == True
    assert result.variables_used["flag"] == True
    
    # String "false" converts
    result = expander.expand(template, {"flag": "false"})
    assert result.success == True
    assert result.variables_used["flag"] == False
    
    # Other strings rejected
    result = expander.expand(template, {"flag": "maybe"})
    assert result.success == False


# ===== Validation Tests =====

def test_pattern_validation_success(template_with_pattern):
    """Test pattern validation accepts valid values"""
    expander = CommandExpander()
    result = expander.expand(template_with_pattern, {"version": "1.2.3"})
    
    assert result.success == True
    assert result.command == "git tag 1.2.3"


def test_pattern_validation_failure(template_with_pattern):
    """Test pattern validation rejects invalid values"""
    expander = CommandExpander()
    
    # Invalid format
    result = expander.expand(template_with_pattern, {"version": "v1.2.3"})
    assert result.success == False
    assert "pattern" in result.errors[0].lower()
    
    # Missing patch version
    result = expander.expand(template_with_pattern, {"version": "1.2"})
    assert result.success == False


def test_options_validation_success(template_with_options):
    """Test options validation accepts valid values"""
    expander = CommandExpander()
    result = expander.expand(
        template_with_options,
        {"environment": "prod", "region": "eu-west-1"}
    )
    
    assert result.success == True
    assert "prod" in result.command
    assert "eu-west-1" in result.command


def test_options_validation_failure(template_with_options):
    """Test options validation rejects invalid values"""
    expander = CommandExpander()
    
    # Invalid environment
    result = expander.expand(template_with_options, {"environment": "production"})
    assert result.success == False
    assert "one of" in result.errors[0].lower()
    assert "dev" in result.errors[0]


def test_range_validation_success(template_with_range):
    """Test range validation accepts valid values"""
    expander = CommandExpander()
    result = expander.expand(
        template_with_range,
        {"memory": 2048, "cpu": 2.0}
    )
    
    assert result.success == True
    assert "2048" in result.command
    assert "2.0" in result.command


def test_range_validation_min_failure(template_with_range):
    """Test range validation rejects values below minimum"""
    expander = CommandExpander()
    result = expander.expand(
        template_with_range,
        {"memory": 256, "cpu": 2.0}  # memory too low
    )
    
    assert result.success == False
    assert "512" in result.errors[0]  # Shows minimum


def test_range_validation_max_failure(template_with_range):
    """Test range validation rejects values above maximum"""
    expander = CommandExpander()
    result = expander.expand(
        template_with_range,
        {"memory": 32768, "cpu": 2.0}  # memory too high
    )
    
    assert result.success == False
    assert "16384" in result.errors[0]  # Shows maximum


# ===== Complex Template Tests =====

def test_complex_template_all_defaults(complex_template):
    """Test complex template with all default values"""
    expander = CommandExpander()
    result = expander.expand(complex_template, {})
    
    assert result.success == True
    assert "tests/" in result.command
    assert "src/" in result.command
    assert "-v" in result.command  # verbose=True
    assert "--workers=4" in result.command


def test_complex_template_mixed_values(complex_template):
    """Test complex template with mix of provided and default values"""
    expander = CommandExpander()
    result = expander.expand(
        complex_template,
        {"path": "tests/unit", "verbose": False, "workers": 8}
    )
    
    assert result.success == True
    assert "tests/unit" in result.command
    assert "src/" in result.command  # default
    assert "-q" in result.command  # verbose=False
    assert "--workers=8" in result.command


def test_complex_template_all_provided(complex_template):
    """Test complex template with all values provided"""
    expander = CommandExpander()
    result = expander.expand(
        complex_template,
        {
            "path": "tests/integration",
            "coverage": "lib/",
            "verbose": True,
            "workers": 12
        }
    )
    
    assert result.success == True
    assert "tests/integration" in result.command
    assert "lib/" in result.command
    assert "-v" in result.command
    assert "--workers=12" in result.command
    assert len(result.warnings) == 0  # No defaults used


# ===== Error Handling Tests =====

def test_multiple_errors():
    """Test handling multiple validation errors"""
    template = Template(
        name="multi",
        command="cmd {{ var1 }} {{ var2 }}",
        description="Test",
        variables=[
            VariableSpec(name="var1", type="integer", required=True, description=""),
            VariableSpec(name="var2", type="string", required=True, pattern=r'^\d+$', description="")
        ]
    )
    
    expander = CommandExpander()
    result = expander.expand(template, {"var1": "not-a-number", "var2": "invalid"})
    
    assert result.success == False
    assert len(result.errors) >= 2


def test_template_syntax_error():
    """Test handling of invalid Jinja2 syntax"""
    template = Template(
        name="broken",
        command="echo {{ missing_brace",
        description="Broken template",
        variables=[]
    )
    
    expander = CommandExpander()
    result = expander.expand(template, {})
    
    assert result.success == False
    assert len(result.errors) > 0


# ===== Preview Tests =====

def test_preview_success(simple_template):
    """Test preview generation for successful expansion"""
    expander = CommandExpander()
    preview = expander.preview(simple_template, {"message": "Test"})
    
    assert "echo" in preview.lower()
    assert "Test" in preview
    assert "✓" in preview or "successful" in preview.lower()
    assert "message = Test" in preview


def test_preview_failure(simple_template):
    """Test preview generation for failed expansion"""
    expander = CommandExpander()
    preview = expander.preview(simple_template, {})
    
    assert "failed" in preview.lower() or "✗" in preview
    assert "required" in preview.lower()
    assert "message" in preview.lower()


def test_preview_with_warnings(template_with_defaults):
    """Test preview shows warnings for default values"""
    expander = CommandExpander()
    preview = expander.preview(template_with_defaults, {})
    
    assert "warning" in preview.lower() or "⚠" in preview
    assert "default" in preview.lower()


# ===== Convenience Function Tests =====

def test_expand_template_function(simple_template):
    """Test convenience function expand_template"""
    result = expand_template(simple_template, {"message": "Hello"})
    
    assert isinstance(result, ExpansionResult)
    assert result.success == True
    assert result.command == "echo 'Hello'"


def test_preview_template_function(simple_template):
    """Test convenience function preview_template"""
    preview = preview_template(simple_template, {"message": "Hello"})
    
    assert isinstance(preview, str)
    assert "Hello" in preview


# ===== Edge Cases =====

def test_empty_variables_dict(simple_template):
    """Test expansion with empty variables dict"""
    expander = CommandExpander()
    result = expander.expand(simple_template, {})
    
    assert result.success == False  # Required variable missing


def test_none_variables(template_with_defaults):
    """Test expansion with None as variables (should use defaults)"""
    expander = CommandExpander()
    result = expander.expand(template_with_defaults, None)
    
    assert result.success == True
    assert result.variables_used["port"] == 8080


def test_extra_variables(simple_template):
    """Test expansion ignores extra variables"""
    expander = CommandExpander()
    result = expander.expand(
        simple_template,
        {"message": "Hello", "extra": "ignored"}
    )
    
    assert result.success == True
    assert "extra" not in result.variables_used


def test_empty_string_value(simple_template):
    """Test expansion with empty string (should be valid for string type)"""
    expander = CommandExpander()
    result = expander.expand(simple_template, {"message": ""})
    
    assert result.success == True
    assert result.command == "echo ''"


def test_zero_values(template_with_range):
    """Test expansion handles zero values correctly"""
    template = Template(
        name="test",
        command="echo {{ value }}",
        description="Test",
        variables=[
            VariableSpec(
                name="value",
                type="integer",
                required=True,
                min=0,
                max=10,
                description=""
            )
        ]
    )
    
    expander = CommandExpander()
    result = expander.expand(template, {"value": 0})
    
    assert result.success == True
    assert result.variables_used["value"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

