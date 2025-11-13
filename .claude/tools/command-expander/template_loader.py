"""
Template Loader

Loads and validates command templates from YAML files.
"""

import yaml
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class VariableSpec:
    """Specification for a template variable."""
    name: str
    description: str
    required: bool = False
    type: str = "string"
    default: Optional[Any] = None
    pattern: Optional[str] = None
    options: Optional[List[str]] = None
    min: Optional[int] = None
    max: Optional[int] = None


@dataclass
class Template:
    """Command template definition."""
    name: str
    command: str
    description: str
    workflow: str = ""
    variables: List[VariableSpec] = field(default_factory=list)
    aliases: List[str] = field(default_factory=list)
    examples: List[str] = field(default_factory=list)
    safety: Dict[str, bool] = field(default_factory=lambda: {'dangerous': False, 'confirm': False})


@dataclass
class Workflow:
    """Workflow category containing templates."""
    name: str
    description: str
    templates: List[Template] = field(default_factory=list)


class TemplateLoader:
    """
    Loads command templates from YAML files.
    
    Features:
    - Load templates from directory
    - Validate template structure
    - Support for aliases
    - Workflow organization
    - Variable specifications
    """
    
    def __init__(self, templates_dir: Optional[Path] = None):
        """
        Initialize template loader.
        
        Args:
            templates_dir: Directory containing template YAML files
        """
        if templates_dir is None:
            self.templates_dir = Path(__file__).parent / 'templates'
        else:
            self.templates_dir = Path(templates_dir)
        
        self.workflows: Dict[str, Workflow] = {}
        self.templates: Dict[str, Template] = {}
        self.aliases: Dict[str, str] = {}
    
    def load_all(self):
        """Load all template files from templates directory."""
        if not self.templates_dir.exists():
            logger.error(f"Templates directory not found: {self.templates_dir}")
            return
        
        yaml_files = list(self.templates_dir.glob('*.yaml')) + list(self.templates_dir.glob('*.yml'))
        
        for yaml_file in yaml_files:
            try:
                self.load_file(yaml_file)
            except Exception as e:
                logger.error(f"Error loading {yaml_file}: {e}")
        
        logger.info(f"Loaded {len(self.templates)} templates from {len(self.workflows)} workflows")
    
    def load_file(self, file_path: Path):
        """
        Load templates from a single YAML file.
        
        Args:
            file_path: Path to YAML file
        """
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
        
        if not data:
            logger.warning(f"Empty YAML file: {file_path}")
            return
        
        # Extract workflow info
        workflow_name = data.get('workflow')
        if not workflow_name:
            logger.error(f"Missing 'workflow' field in {file_path}")
            return
        
        workflow_desc = data.get('description', '')
        
        # Create workflow if not exists
        if workflow_name not in self.workflows:
            self.workflows[workflow_name] = Workflow(
                name=workflow_name,
                description=workflow_desc
            )
        
        workflow = self.workflows[workflow_name]
        
        # Parse templates
        templates_data = data.get('templates', {})
        for template_name, template_data in templates_data.items():
            template = self._parse_template(template_name, workflow_name, template_data)
            
            # Add to workflow
            workflow.templates[template_name] = template
            
            # Add to global templates
            full_name = f"{workflow_name}.{template_name}"
            self.templates[full_name] = template
            self.templates[template_name] = template  # Also by short name
            
            # Register aliases
            for alias in template.aliases:
                self.aliases[alias] = template_name
        
        logger.info(f"Loaded workflow '{workflow_name}' with {len(templates_data)} templates")
    
    def _parse_template(self, name: str, workflow: str, data: Dict) -> Template:
        """Parse template definition from YAML data."""
        # Parse variables
        variables = {}
        variables_data = data.get('variables', {})
        
        for var_name, var_data in variables_data.items():
            if isinstance(var_data, dict):
                variables[var_name] = VariableSpec(
                    description=var_data.get('description', ''),
                    required=var_data.get('required', False),
                    type=var_data.get('type', 'string'),
                    default=var_data.get('default'),
                    pattern=var_data.get('pattern'),
                    options=var_data.get('options'),
                    min=var_data.get('min'),
                    max=var_data.get('max')
                )
        
        return Template(
            name=name,
            workflow=workflow,
            description=data.get('description', ''),
            command=data.get('command', ''),
            variables=variables,
            aliases=data.get('aliases', []),
            examples=data.get('examples', []),
            dangerous=data.get('dangerous', False),
            confirm=data.get('confirm', False)
        )
    
    def get_template(self, name: str) -> Optional[Template]:
        """
        Get template by name or alias.
        
        Args:
            name: Template name or alias
        
        Returns:
            Template instance or None
        """
        # Check direct name
        if name in self.templates:
            return self.templates[name]
        
        # Check aliases
        if name in self.aliases:
            template_name = self.aliases[name]
            return self.templates.get(template_name)
        
        return None
    
    def list_templates(self, workflow: Optional[str] = None) -> List[Template]:
        """
        List all templates, optionally filtered by workflow.
        
        Args:
            workflow: Workflow name to filter by
        
        Returns:
            List of templates
        """
        if workflow:
            wf = self.workflows.get(workflow)
            return list(wf.templates.values()) if wf else []
        
        # Return all templates (deduplicated)
        seen = set()
        templates = []
        for template in self.templates.values():
            full_name = f"{template.workflow}.{template.name}"
            if full_name not in seen:
                seen.add(full_name)
                templates.append(template)
        
        return templates
    
    def list_workflows(self) -> List[Workflow]:
        """List all workflows."""
        return list(self.workflows.values())
    
    def validate_template(self, template: Template) -> List[str]:
        """
        Validate template definition.
        
        Args:
            template: Template to validate
        
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        if not template.name:
            errors.append("Template name is required")
        
        if not template.command:
            errors.append("Template command is required")
        
        # Validate command contains required variables
        for var_name, var_spec in template.variables.items():
            if var_spec.required and f"{{{{ {var_name}" not in template.command:
                errors.append(f"Required variable '{var_name}' not used in command")
        
        # Validate variable types
        for var_name, var_spec in template.variables.items():
            if var_spec.type not in ['string', 'integer', 'boolean', 'float']:
                errors.append(f"Invalid type '{var_spec.type}' for variable '{var_name}'")
        
        return errors


# ===== Module-level convenience functions =====

def load_workflow(file_path: str) -> Workflow:
    """
    Load a workflow from a YAML file.
    
    Args:
        file_path: Path to YAML file
    
    Returns:
        Workflow instance
    
    Raises:
        FileNotFoundError: If file doesn't exist
        yaml.YAMLError: If YAML is malformed
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Template file not found: {file_path}")
    
    with open(path, 'r') as f:
        data = yaml.safe_load(f)
    
    if not data:
        raise ValueError("Empty YAML file")
    
    # Extract workflow metadata
    workflow_name = data.get('name', '')
    workflow_desc = data.get('description', '')
    
    # Parse templates
    templates_list = []
    templates_data = data.get('templates', [])
    
    for template_data in templates_data:
        # Parse variables
        variables = []
        for var_data in template_data.get('variables', []):
            var_spec = VariableSpec(
                name=var_data.get('name', ''),
                description=var_data.get('description', ''),
                required=var_data.get('required', False),
                type=var_data.get('type', 'string'),
                default=var_data.get('default'),
                pattern=var_data.get('pattern'),
                options=var_data.get('options'),
                min=var_data.get('min'),
                max=var_data.get('max')
            )
            variables.append(var_spec)
        
        # Parse safety flags
        safety_data = template_data.get('safety', {})
        safety = {
            'dangerous': safety_data.get('dangerous', False) if isinstance(safety_data, dict) else False,
            'confirm': safety_data.get('confirm', False) if isinstance(safety_data, dict) else False
        }
        
        template = Template(
            name=template_data.get('name', ''),
            command=template_data.get('command', ''),
            description=template_data.get('description', ''),
            workflow=workflow_name,
            variables=variables,
            aliases=template_data.get('aliases', []),
            examples=template_data.get('examples', []),
            safety=safety
        )
        templates_list.append(template)
    
    return Workflow(
        name=workflow_name,
        description=workflow_desc,
        templates=templates_list
    )


def load_templates(directory: str) -> List[Workflow]:
    """
    Load all workflows from a directory.
    
    Args:
        directory: Path to directory containing YAML files
    
    Returns:
        List of Workflow instances
    """
    workflows = []
    dir_path = Path(directory)
    
    if not dir_path.exists():
        return workflows
    
    for yaml_file in dir_path.glob('*.yaml'):
        try:
            workflow = load_workflow(str(yaml_file))
            workflows.append(workflow)
        except Exception as e:
            logger.error(f"Error loading {yaml_file}: {e}")
    
    return workflows


def get_template_by_name(workflow: Workflow, name: str) -> Optional[Template]:
    """
    Get a template from a workflow by exact name.
    
    Args:
        workflow: Workflow to search
        name: Template name
    
    Returns:
        Template instance or None
    """
    for template in workflow.templates:
        if template.name == name:
            return template
    return None


def get_template_by_alias(workflow: Workflow, alias: str) -> Optional[Template]:
    """
    Get a template from a workflow by alias.
    
    Args:
        workflow: Workflow to search
        alias: Template alias
    
    Returns:
        Template instance or None
    """
    for template in workflow.templates:
        if alias in template.aliases:
            return template
    return None


def validate_template(template: Template) -> tuple[bool, List[str]]:
    """
    Validate a template definition.
    
    Args:
        template: Template to validate
    
    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []
    
    # Check required fields
    if not template.name:
        errors.append("Template name is required")
    
    if not template.command:
        errors.append("Template command is required")
    
    # Validate variable types
    valid_types = ['string', 'integer', 'boolean', 'float']
    for var in template.variables:
        if var.type not in valid_types:
            errors.append(f"Invalid type '{var.type}' for variable '{var.name}'")
    
    # Check required variables are used in command
    for var in template.variables:
        if var.required:
            # Check for Jinja2-style variable reference
            if f"{{{{ {var.name}" not in template.command and f"{{{{{var.name}" not in template.command:
                errors.append(f"Required variable '{var.name}' not found in command")
    
    return (len(errors) == 0, errors)

