"""
Python Parser

Wrapper around Python AST parsing from metadata_extractor.
"""

import ast
from pathlib import Path
from typing import Dict, Any, List
import logging

from .base_parser import BaseParser

logger = logging.getLogger(__name__)


class PythonParser(BaseParser):
    """
    Parser for Python source files using AST.
    
    Extracts classes, functions, docstrings, and imports.
    """
    
    def get_supported_extensions(self) -> List[str]:
        """Get supported file extensions."""
        return ['.py', '.pyi']
    
    def supports_file(self, file_path: Path) -> bool:
        """Check if file is a Python file."""
        return file_path.suffix in self.get_supported_extensions()
    
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse a Python file using AST.
        
        Args:
            file_path: Path to Python file
        
        Returns:
            Dictionary with parsed metadata
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
            
            tree = ast.parse(source, filename=str(file_path))
            
            module_data = {
                'file': file_path.name,
                'path': str(file_path),
                'language': 'python',
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
                        'methods': [],
                        'line': node.lineno
                    }
                    
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            class_data['methods'].append({
                                'name': item.name,
                                'docstring': ast.get_docstring(item),
                                'args': [arg.arg for arg in item.args.args],
                                'line': item.lineno
                            })
                    
                    module_data['classes'].append(class_data)
                
                elif isinstance(node, ast.FunctionDef) and not self._is_nested(node, tree):
                    # Only top-level functions
                    module_data['functions'].append({
                        'name': node.name,
                        'docstring': ast.get_docstring(node),
                        'args': [arg.arg for arg in node.args.args],
                        'line': node.lineno
                    })
                
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    # Track imports
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            module_data['imports'].append({
                                'module': alias.name,
                                'as': alias.asname,
                                'line': node.lineno
                            })
                    elif isinstance(node, ast.ImportFrom):
                        for alias in node.names:
                            module_data['imports'].append({
                                'from': node.module,
                                'import': alias.name,
                                'as': alias.asname,
                                'line': node.lineno
                            })
            
            logger.info(f"Parsed Python file: {file_path}")
            return module_data
            
        except SyntaxError as e:
            logger.error(f"Syntax error in {file_path}: {e}")
            return {'error': str(e), 'file': file_path.name}
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            return {'error': str(e), 'file': file_path.name}
    
    def _is_nested(self, func_node: ast.FunctionDef, tree: ast.Module) -> bool:
        """Check if function is nested inside a class."""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if item is func_node:
                        return True
        return False

