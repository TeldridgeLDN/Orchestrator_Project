"""
Metadata Extraction Module

This module provides functionality to extract metadata from skill configuration files
(YAML, JSON) and Python docstrings for documentation generation.

Author: Momentum Squared
Date: November 13, 2025
Version: 1.0.0
"""

import json
import yaml
import ast
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """
    Extracts metadata from various configuration formats and Python code.
    
    Supports:
    - YAML configuration files
    - JSON configuration files  
    - Python docstrings (module, class, function level)
    """
    
    def __init__(self):
        """Initialize the metadata extractor."""
        self.supported_config_files = ['skill.yaml', 'skill.yml', 'skill.json', 'config.yaml', 'config.json']
    
    def extract_from_skill_directory(self, skill_path: Path) -> Dict[str, Any]:
        """
        Extract all available metadata from a skill directory.
        
        Args:
            skill_path: Path to the skill directory
        
        Returns:
            Dictionary containing all extracted metadata
        """
        metadata = {
            'name': skill_path.name,
            'path': str(skill_path),
            'config': {},
            'python_modules': [],
            'has_config': False,
            'has_python': False
        }
        
        # Extract from configuration files
        config_data = self.extract_config(skill_path)
        if config_data:
            metadata['config'] = config_data
            metadata['has_config'] = True
        
        # Extract from Python modules
        python_data = self.extract_python_modules(skill_path)
        if python_data:
            metadata['python_modules'] = python_data
            metadata['has_python'] = True
        
        return metadata
    
    def extract_config(self, skill_path: Path) -> Dict[str, Any]:
        """
        Extract metadata from configuration files (YAML/JSON).
        
        Searches for skill.yaml, skill.json, config.yaml, config.json in order.
        
        Args:
            skill_path: Path to the skill directory
        
        Returns:
            Dictionary with configuration data, or empty dict if none found
        """
        for config_file in self.supported_config_files:
            config_path = skill_path / config_file
            
            if config_path.exists():
                try:
                    if config_file.endswith(('.yaml', '.yml')):
                        return self.extract_yaml(config_path)
                    elif config_file.endswith('.json'):
                        return self.extract_json(config_path)
                except Exception as e:
                    logger.error(f"Error extracting config from {config_path}: {e}")
        
        return {}
    
    def extract_yaml(self, yaml_path: Path) -> Dict[str, Any]:
        """
        Extract metadata from a YAML file.
        
        Args:
            yaml_path: Path to the YAML file
        
        Returns:
            Dictionary with YAML data
        """
        try:
            with open(yaml_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                
            if data is None:
                logger.warning(f"Empty YAML file: {yaml_path}")
                return {}
            
            logger.info(f"Successfully extracted YAML metadata from {yaml_path}")
            return data
            
        except yaml.YAMLError as e:
            logger.error(f"YAML parsing error in {yaml_path}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error reading YAML {yaml_path}: {e}")
            return {}
    
    def extract_json(self, json_path: Path) -> Dict[str, Any]:
        """
        Extract metadata from a JSON file.
        
        Args:
            json_path: Path to the JSON file
        
        Returns:
            Dictionary with JSON data
        """
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Successfully extracted JSON metadata from {json_path}")
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error in {json_path}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error reading JSON {json_path}: {e}")
            return {}
    
    def extract_python_modules(self, skill_path: Path) -> List[Dict[str, Any]]:
        """
        Extract metadata from all Python modules in a skill directory.
        
        Recursively searches for .py files and extracts docstrings.
        
        Args:
            skill_path: Path to the skill directory
        
        Returns:
            List of dictionaries with Python module metadata
        """
        modules = []
        
        # Find all Python files
        python_files = list(skill_path.rglob('*.py'))
        
        for py_file in python_files:
            # Skip __pycache__ and test files for now
            if '__pycache__' in str(py_file) or py_file.name.startswith('test_'):
                continue
            
            try:
                module_data = self.extract_python_docstrings(py_file)
                if module_data:
                    modules.append(module_data)
            except Exception as e:
                logger.error(f"Error extracting from {py_file}: {e}")
        
        return modules
    
    def extract_python_docstrings(self, python_path: Path) -> Dict[str, Any]:
        """
        Extract docstrings from a Python file using AST parsing.
        
        Args:
            python_path: Path to the Python file
        
        Returns:
            Dictionary with module, class, and function docstrings
        """
        try:
            with open(python_path, 'r', encoding='utf-8') as f:
                source = f.read()
            
            tree = ast.parse(source, filename=str(python_path))
            
            module_data = {
                'file': python_path.name,
                'path': str(python_path.relative_to(python_path.parent.parent.parent)),
                'module_docstring': ast.get_docstring(tree),
                'classes': [],
                'functions': [],
                'imports': []
            }
            
            # Extract classes and their methods
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    class_data = {
                        'name': node.name,
                        'docstring': ast.get_docstring(node),
                        'methods': []
                    }
                    
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            class_data['methods'].append({
                                'name': item.name,
                                'docstring': ast.get_docstring(item),
                                'args': [arg.arg for arg in item.args.args]
                            })
                    
                    module_data['classes'].append(class_data)
                
                elif isinstance(node, ast.FunctionDef) and not self._is_nested(node, tree):
                    # Only top-level functions
                    module_data['functions'].append({
                        'name': node.name,
                        'docstring': ast.get_docstring(node),
                        'args': [arg.arg for arg in node.args.args]
                    })
                
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    # Track imports
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            module_data['imports'].append({
                                'module': alias.name,
                                'as': alias.asname
                            })
                    elif isinstance(node, ast.ImportFrom):
                        for alias in node.names:
                            module_data['imports'].append({
                                'from': node.module,
                                'import': alias.name,
                                'as': alias.asname
                            })
            
            logger.info(f"Extracted Python metadata from {python_path}")
            return module_data
            
        except SyntaxError as e:
            logger.error(f"Syntax error in {python_path}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error parsing {python_path}: {e}")
            return {}
    
    def _is_nested(self, func_node: ast.FunctionDef, tree: ast.Module) -> bool:
        """
        Check if a function is nested inside a class (method).
        
        Args:
            func_node: Function node to check
            tree: AST tree
        
        Returns:
            True if function is nested (inside a class)
        """
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if item is func_node:
                        return True
        return False
    
    def normalize_metadata(self, raw_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize extracted metadata to a standard format.
        
        Ensures consistent field names and structure across different sources.
        
        Args:
            raw_metadata: Raw metadata dictionary
        
        Returns:
            Normalized metadata dictionary
        """
        normalized = {
            'name': raw_metadata.get('name', 'Unnamed Skill'),
            'version': raw_metadata.get('version', '0.0.0'),
            'description': raw_metadata.get('description', ''),
            'author': raw_metadata.get('author', ''),
            'keywords': raw_metadata.get('keywords', []),
            'capabilities': raw_metadata.get('capabilities', []),
            'dependencies': raw_metadata.get('dependencies', {}),
            'config': raw_metadata.get('config', {}),
            'python_modules': raw_metadata.get('python_modules', [])
        }
        
        return normalized


def main():
    """CLI entry point for testing metadata extraction."""
    import sys
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    # Parse arguments
    if len(sys.argv) < 2:
        print("Usage: python metadata_extractor.py <skill_directory>")
        sys.exit(1)
    
    skill_path = Path(sys.argv[1])
    
    if not skill_path.exists():
        print(f"Error: Directory not found: {skill_path}")
        sys.exit(1)
    
    # Extract metadata
    extractor = MetadataExtractor()
    metadata = extractor.extract_from_skill_directory(skill_path)
    
    # Display results
    print(f"\n📦 Metadata for: {metadata['name']}\n")
    print(f"Path: {metadata['path']}")
    print(f"Has Config: {'✓' if metadata['has_config'] else '✗'}")
    print(f"Has Python: {'✓' if metadata['has_python'] else '✗'}")
    
    if metadata['config']:
        print(f"\n🔧 Configuration:")
        print(json.dumps(metadata['config'], indent=2))
    
    if metadata['python_modules']:
        print(f"\n🐍 Python Modules ({len(metadata['python_modules'])}):")
        for module in metadata['python_modules']:
            print(f"\n  📄 {module['file']}")
            if module['module_docstring']:
                print(f"     {module['module_docstring'][:100]}...")
            print(f"     Classes: {len(module['classes'])}")
            print(f"     Functions: {len(module['functions'])}")


if __name__ == '__main__':
    main()

