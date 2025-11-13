"""
Comprehensive test suite for template_loader.py

Tests cover:
- Valid YAML template loading
- Variable specification parsing
- Required field validation
- Missing file handling
- Malformed YAML handling
- Alias resolution
- Safety flag parsing
- Workflow organization
"""

import pytest
import tempfile
import os
from pathlib import Path
import yaml

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from template_loader import (
    VariableSpec,
    Template,
    Workflow,
    load_templates,
    load_workflow,
    get_template_by_name,
    get_template_by_alias,
    validate_template
)


# ===== Fixtures =====

@pytest.fixture
def sample_valid_yaml():
    """Sample valid YAML template content"""
    return """
name: git-commit
description: Commit changes with message
templates:
  - name: commit
    command: "git commit -m '{{ message }}'"
    description: Commit with message
    variables:
      - name: message
        type: string
        required: true
        description: Commit message
    examples:
      - "commit --message='feat: add feature'"
    aliases:
      - c
      - cm
    safety:
      dangerous: false
      confirm: false
"""

@pytest.fixture
def sample_complex_yaml():
    """Sample YAML with multiple templates and complex variables"""
    return """
name: testing
description: Testing workflow templates
templates:
  - name: test-run
    command: "pytest {{ path }} --cov={{ coverage_path }} -v"
    description: Run tests with coverage
    variables:
      - name: path
        type: string
        required: false
        default: tests/
        description: Test path
      - name: coverage_path
        type: string
        required: false
        default: src/
        description: Coverage path
      - name: verbose
        type: boolean
        required: false
        default: true
        description: Verbose output
    examples:
      - "test-run --path=tests/unit"
    aliases:
      - test
      - t
    
  - name: lint
    command: "ruff check {{ path }}"
    description: Run linter
    variables:
      - name: path
        type: string
        required: false
        default: .
        description: Path to lint
    safety:
      dangerous: false
"""

@pytest.fixture
def sample_invalid_yaml():
    """Sample invalid YAML (malformed)"""
    return """
name: invalid
description: Invalid template
templates:
  - name: broken
    command: "echo 'test'"
    variables:
      - name: var1
        type: invalid_type
        required: not_a_boolean
"""

@pytest.fixture
def temp_yaml_file(tmp_path):
    """Create a temporary YAML file"""
    def _create_file(content):
        file_path = tmp_path / "test_template.yaml"
        file_path.write_text(content)
        return str(file_path)
    return _create_file


# ===== Template Loading Tests =====

def test_load_valid_template(sample_valid_yaml, temp_yaml_file):
    """Test loading a valid YAML template file"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    
    assert workflow is not None
    assert workflow.name == "git-commit"
    assert workflow.description == "Commit changes with message"
    assert len(workflow.templates) == 1
    
    template = workflow.templates[0]
    assert template.name == "commit"
    assert template.command == "git commit -m '{{ message }}'"
    assert len(template.variables) == 1
    assert len(template.aliases) == 2


def test_load_complex_template(sample_complex_yaml, temp_yaml_file):
    """Test loading a template with multiple templates and complex variables"""
    file_path = temp_yaml_file(sample_complex_yaml)
    workflow = load_workflow(file_path)
    
    assert len(workflow.templates) == 2
    
    # Check first template (test-run)
    test_template = workflow.templates[0]
    assert test_template.name == "test-run"
    assert len(test_template.variables) == 3
    
    # Check variables
    path_var = test_template.variables[0]
    assert path_var.name == "path"
    assert path_var.type == "string"
    assert path_var.required == False
    assert path_var.default == "tests/"
    
    # Check aliases
    assert "test" in test_template.aliases
    assert "t" in test_template.aliases


def test_load_missing_file():
    """Test loading a non-existent file"""
    with pytest.raises(FileNotFoundError):
        load_workflow("/nonexistent/path/template.yaml")


def test_load_malformed_yaml(temp_yaml_file):
    """Test loading malformed YAML"""
    malformed_content = """
    name: broken
    description: "unterminated string
    templates:
      - name: test
    """
    file_path = temp_yaml_file(malformed_content)
    
    with pytest.raises(yaml.YAMLError):
        load_workflow(file_path)


# ===== Variable Specification Tests =====

def test_variable_spec_creation():
    """Test creating VariableSpec objects"""
    var_spec = VariableSpec(
        name="test_var",
        type="string",
        required=True,
        description="Test variable"
    )
    
    assert var_spec.name == "test_var"
    assert var_spec.type == "string"
    assert var_spec.required == True
    assert var_spec.default is None


def test_variable_spec_with_default():
    """Test VariableSpec with default value"""
    var_spec = VariableSpec(
        name="port",
        type="integer",
        required=False,
        default=8080,
        description="Port number"
    )
    
    assert var_spec.default == 8080
    assert var_spec.required == False


def test_variable_spec_with_options():
    """Test VariableSpec with option constraints"""
    var_spec = VariableSpec(
        name="env",
        type="string",
        required=True,
        options=["dev", "staging", "prod"],
        description="Environment"
    )
    
    assert var_spec.options == ["dev", "staging", "prod"]


def test_variable_spec_with_pattern():
    """Test VariableSpec with regex pattern"""
    var_spec = VariableSpec(
        name="version",
        type="string",
        required=True,
        pattern=r"^\d+\.\d+\.\d+$",
        description="Semantic version"
    )
    
    assert var_spec.pattern == r"^\d+\.\d+\.\d+$"


# ===== Template Validation Tests =====

def test_validate_complete_template(sample_valid_yaml, temp_yaml_file):
    """Test validation of a complete, valid template"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    template = workflow.templates[0]
    
    is_valid, errors = validate_template(template)
    
    assert is_valid == True
    assert len(errors) == 0


def test_validate_template_missing_required_fields():
    """Test validation fails for missing required fields"""
    template = Template(
        name="incomplete",
        command="",  # Empty command
        description="Test"
    )
    
    is_valid, errors = validate_template(template)
    
    assert is_valid == False
    assert any("command" in error.lower() for error in errors)


def test_validate_template_invalid_variable_type():
    """Test validation catches invalid variable types"""
    template = Template(
        name="test",
        command="echo {{ var }}",
        description="Test",
        variables=[
            VariableSpec(
                name="var",
                type="invalid_type",  # Invalid type
                required=True,
                description="Test var"
            )
        ]
    )
    
    is_valid, errors = validate_template(template)
    
    assert is_valid == False
    assert any("type" in error.lower() for error in errors)


# ===== Alias Resolution Tests =====

def test_get_template_by_alias(sample_valid_yaml, temp_yaml_file):
    """Test retrieving template by alias"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    
    template = get_template_by_alias(workflow, "c")
    
    assert template is not None
    assert template.name == "commit"


def test_get_template_by_multiple_aliases(sample_complex_yaml, temp_yaml_file):
    """Test retrieving template by different aliases"""
    file_path = temp_yaml_file(sample_complex_yaml)
    workflow = load_workflow(file_path)
    
    # Try both aliases
    template1 = get_template_by_alias(workflow, "test")
    template2 = get_template_by_alias(workflow, "t")
    
    assert template1 is not None
    assert template2 is not None
    assert template1.name == template2.name == "test-run"


def test_get_template_by_invalid_alias(sample_valid_yaml, temp_yaml_file):
    """Test retrieving with non-existent alias"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    
    template = get_template_by_alias(workflow, "nonexistent")
    
    assert template is None


# ===== Template Retrieval Tests =====

def test_get_template_by_name(sample_complex_yaml, temp_yaml_file):
    """Test retrieving template by exact name"""
    file_path = temp_yaml_file(sample_complex_yaml)
    workflow = load_workflow(file_path)
    
    template = get_template_by_name(workflow, "lint")
    
    assert template is not None
    assert template.name == "lint"


def test_get_template_by_invalid_name(sample_valid_yaml, temp_yaml_file):
    """Test retrieving with non-existent name"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    
    template = get_template_by_name(workflow, "nonexistent")
    
    assert template is None


# ===== Safety Flag Tests =====

def test_template_safety_flags(sample_valid_yaml, temp_yaml_file):
    """Test safety flag parsing"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    template = workflow.templates[0]
    
    assert hasattr(template, 'safety')
    assert template.safety.get('dangerous') == False
    assert template.safety.get('confirm') == False


def test_template_dangerous_flag():
    """Test template marked as dangerous"""
    dangerous_yaml = """
name: system
description: System commands
templates:
  - name: delete-all
    command: "rm -rf {{ path }}"
    description: Delete files
    variables:
      - name: path
        type: string
        required: true
        description: Path to delete
    safety:
      dangerous: true
      confirm: true
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(dangerous_yaml)
        f.flush()
        
        workflow = load_workflow(f.name)
        template = workflow.templates[0]
        
        assert template.safety.get('dangerous') == True
        assert template.safety.get('confirm') == True
        
        os.unlink(f.name)


# ===== Workflow Organization Tests =====

def test_workflow_metadata(sample_valid_yaml, temp_yaml_file):
    """Test workflow-level metadata"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    
    assert workflow.name == "git-commit"
    assert workflow.description == "Commit changes with message"
    assert isinstance(workflow.templates, list)


def test_load_multiple_workflows(sample_valid_yaml, sample_complex_yaml, temp_yaml_file, tmp_path):
    """Test loading multiple workflow files"""
    # Create multiple files
    file1 = tmp_path / "workflow1.yaml"
    file2 = tmp_path / "workflow2.yaml"
    
    file1.write_text(sample_valid_yaml)
    file2.write_text(sample_complex_yaml)
    
    # Load both
    workflow1 = load_workflow(str(file1))
    workflow2 = load_workflow(str(file2))
    
    assert workflow1.name != workflow2.name
    assert len(workflow1.templates) == 1
    assert len(workflow2.templates) == 2


# ===== Integration Tests =====

def test_complete_template_workflow(sample_complex_yaml, temp_yaml_file):
    """Test complete workflow from loading to retrieval"""
    file_path = temp_yaml_file(sample_complex_yaml)
    
    # Load
    workflow = load_workflow(file_path)
    assert workflow is not None
    
    # Get by name
    template = get_template_by_name(workflow, "test-run")
    assert template is not None
    
    # Get by alias
    template_by_alias = get_template_by_alias(workflow, "test")
    assert template_by_alias is not None
    assert template.name == template_by_alias.name
    
    # Validate
    is_valid, errors = validate_template(template)
    assert is_valid == True
    
    # Check variables
    assert len(template.variables) == 3
    path_var = next(v for v in template.variables if v.name == "path")
    assert path_var.default == "tests/"


def test_template_examples_parsing(sample_valid_yaml, temp_yaml_file):
    """Test that examples are correctly parsed"""
    file_path = temp_yaml_file(sample_valid_yaml)
    workflow = load_workflow(file_path)
    template = workflow.templates[0]
    
    assert len(template.examples) == 1
    assert "feat: add feature" in template.examples[0]


# ===== Edge Cases =====

def test_empty_yaml_file(temp_yaml_file):
    """Test loading an empty YAML file"""
    file_path = temp_yaml_file("")
    
    with pytest.raises(Exception):  # Should raise some error
        load_workflow(file_path)


def test_template_without_variables(temp_yaml_file):
    """Test template with no variables (static command)"""
    static_yaml = """
name: static
description: Static commands
templates:
  - name: status
    command: "git status"
    description: Show git status
"""
    file_path = temp_yaml_file(static_yaml)
    workflow = load_workflow(file_path)
    template = workflow.templates[0]
    
    assert len(template.variables) == 0
    assert template.command == "git status"


def test_template_with_special_characters(temp_yaml_file):
    """Test template with special characters in command"""
    special_yaml = """
name: special
description: Commands with special chars
templates:
  - name: complex
    command: "echo \\"{{ message }}\\" && ls -la | grep '{{ pattern }}'"
    description: Complex command
    variables:
      - name: message
        type: string
        required: true
        description: Message
      - name: pattern
        type: string
        required: true
        description: Pattern
"""
    file_path = temp_yaml_file(special_yaml)
    workflow = load_workflow(file_path)
    template = workflow.templates[0]
    
    assert "&&" in template.command
    assert "|" in template.command
    assert "grep" in template.command


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

