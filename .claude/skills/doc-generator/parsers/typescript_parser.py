"""
TypeScript/JavaScript Parser

Parser for TypeScript and JavaScript using tree-sitter.
Falls back to regex-based parsing if tree-sitter is unavailable.
"""

import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

from .base_parser import BaseParser

logger = logging.getLogger(__name__)

# Try to import tree-sitter
try:
    from tree_sitter import Language, Parser
    TREE_SITTER_AVAILABLE = True
except ImportError:
    TREE_SITTER_AVAILABLE = False
    logger.warning("tree-sitter not available, falling back to regex-based parsing")


class TypeScriptParser(BaseParser):
    """
    Parser for TypeScript and JavaScript files.
    
    Uses tree-sitter if available, falls back to regex-based parsing.
    """
    
    def __init__(self):
        """Initialize the parser."""
        self.parser = None
        self.use_tree_sitter = False
        
        if TREE_SITTER_AVAILABLE:
            try:
                # Try to initialize tree-sitter parser
                # Note: In production, you'd build the language library first
                # For now, we'll use regex fallback
                pass
            except Exception as e:
                logger.warning(f"Could not initialize tree-sitter: {e}")
    
    def get_supported_extensions(self) -> List[str]:
        """Get supported file extensions."""
        return ['.ts', '.tsx', '.js', '.jsx']
    
    def supports_file(self, file_path: Path) -> bool:
        """Check if file is TypeScript or JavaScript."""
        return file_path.suffix in self.get_supported_extensions()
    
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse a TypeScript/JavaScript file.
        
        Args:
            file_path: Path to TS/JS file
        
        Returns:
            Dictionary with parsed metadata
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
            
            if self.use_tree_sitter and self.parser:
                return self._parse_with_tree_sitter(file_path, source)
            else:
                return self._parse_with_regex(file_path, source)
                
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            return {'error': str(e), 'file': file_path.name}
    
    def _parse_with_regex(self, file_path: Path, source: str) -> Dict[str, Any]:
        """
        Parse TypeScript/JavaScript using regex patterns.
        
        This is a fallback method that provides basic parsing.
        """
        module_data = {
            'file': file_path.name,
            'path': str(file_path),
            'language': 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript',
            'module_docstring': self._extract_file_docstring(source),
            'classes': self._extract_classes(source),
            'functions': self._extract_functions(source),
            'imports': self._extract_imports(source),
            'exports': self._extract_exports(source)
        }
        
        logger.info(f"Parsed {module_data['language']} file with regex: {file_path}")
        return module_data
    
    def _extract_file_docstring(self, source: str) -> Optional[str]:
        """Extract leading JSDoc comment as file docstring."""
        # Match JSDoc comment at start of file
        pattern = r'^\s*/\*\*(.*?)\*/'
        match = re.search(pattern, source, re.DOTALL)
        if match:
            # Clean up the comment
            comment = match.group(1)
            lines = [line.strip().lstrip('*').strip() for line in comment.split('\n')]
            return '\n'.join(line for line in lines if line)
        return None
    
    def _extract_classes(self, source: str) -> List[Dict[str, Any]]:
        """Extract class definitions."""
        classes = []
        
        # Match: class ClassName { ... }
        # Also handles: export class, export default class
        class_pattern = r'(?:export\s+(?:default\s+)?)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{'
        
        for match in re.finditer(class_pattern, source):
            class_name = match.group(1)
            extends = match.group(2)
            implements = match.group(3)
            
            # Try to find JSDoc before class
            doc_pattern = r'/\*\*(.*?)\*/\s*(?:export\s+(?:default\s+)?)?class\s+' + re.escape(class_name)
            doc_match = re.search(doc_pattern, source, re.DOTALL)
            docstring = None
            if doc_match:
                doc_lines = [line.strip().lstrip('*').strip() 
                           for line in doc_match.group(1).split('\n')]
                docstring = '\n'.join(line for line in doc_lines if line)
            
            # Extract methods for this class
            methods = self._extract_class_methods(source, class_name, match.start())
            
            classes.append({
                'name': class_name,
                'extends': extends,
                'implements': implements.split(',') if implements else None,
                'docstring': docstring,
                'methods': methods
            })
        
        return classes
    
    def _extract_class_methods(self, source: str, class_name: str, class_start: int) -> List[Dict[str, Any]]:
        """Extract methods from a class."""
        methods = []
        
        # Find the class body
        brace_count = 0
        in_class = False
        class_body_start = -1
        class_body_end = -1
        
        for i in range(class_start, len(source)):
            if source[i] == '{':
                if not in_class:
                    in_class = True
                    class_body_start = i
                brace_count += 1
            elif source[i] == '}':
                brace_count -= 1
                if in_class and brace_count == 0:
                    class_body_end = i
                    break
        
        if class_body_start == -1 or class_body_end == -1:
            return methods
        
        class_body = source[class_body_start:class_body_end]
        
        # Match method definitions
        # Handles: methodName(...), async methodName(...), static methodName(...)
        method_pattern = r'(?:async\s+)?(?:static\s+)?(\w+)\s*\((.*?)\)\s*(?::\s*([\w\<\>\[\]\|\s]+))?\s*\{'
        
        for match in re.finditer(method_pattern, class_body):
            method_name = match.group(1)
            params = match.group(2)
            return_type = match.group(3)
            
            # Skip constructor as special case
            is_constructor = method_name == 'constructor'
            
            # Extract JSDoc for method
            doc_pattern = r'/\*\*(.*?)\*/\s*(?:async\s+)?(?:static\s+)?' + re.escape(method_name)
            doc_match = re.search(doc_pattern, class_body, re.DOTALL)
            docstring = None
            if doc_match:
                doc_lines = [line.strip().lstrip('*').strip() 
                           for line in doc_match.group(1).split('\n')]
                docstring = '\n'.join(line for line in doc_lines if line)
            
            methods.append({
                'name': method_name,
                'params': params.strip(),
                'return_type': return_type,
                'docstring': docstring,
                'is_constructor': is_constructor
            })
        
        return methods
    
    def _extract_functions(self, source: str) -> List[Dict[str, Any]]:
        """Extract function definitions."""
        functions = []
        
        # Match various function forms:
        # function name(...) { }
        # export function name(...) { }
        # const name = (...) => { }
        # export const name = (...) => { }
        
        patterns = [
            r'(?:export\s+)?function\s+(\w+)\s*\((.*?)\)\s*(?::\s*([\w\<\>\[\]\|\s]+))?\s*\{',
            r'(?:export\s+)?const\s+(\w+)\s*=\s*\((.*?)\)\s*(?::\s*([\w\<\>\[\]\|\s]+))?\s*=>\s*\{',
            r'(?:export\s+)?const\s+(\w+)\s*=\s*async\s*\((.*?)\)\s*(?::\s*([\w\<\>\[\]\|\s]+))?\s*=>\s*\{'
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, source):
                func_name = match.group(1)
                params = match.group(2)
                return_type = match.group(3)
                
                # Extract JSDoc
                doc_pattern = r'/\*\*(.*?)\*/\s*(?:export\s+)?(?:function|const)\s+' + re.escape(func_name)
                doc_match = re.search(doc_pattern, source, re.DOTALL)
                docstring = None
                if doc_match:
                    doc_lines = [line.strip().lstrip('*').strip() 
                               for line in doc_match.group(1).split('\n')]
                    docstring = '\n'.join(line for line in doc_lines if line)
                
                functions.append({
                    'name': func_name,
                    'params': params.strip(),
                    'return_type': return_type,
                    'docstring': docstring
                })
        
        return functions
    
    def _extract_imports(self, source: str) -> List[Dict[str, Any]]:
        """Extract import statements."""
        imports = []
        
        # Match: import ... from '...'
        import_pattern = r'import\s+(.+?)\s+from\s+[\'"](.+?)[\'"]'
        
        for match in re.finditer(import_pattern, source):
            imported = match.group(1).strip()
            module = match.group(2)
            
            imports.append({
                'imported': imported,
                'from': module
            })
        
        return imports
    
    def _extract_exports(self, source: str) -> List[str]:
        """Extract export statements."""
        exports = []
        
        # Match: export { name }
        export_pattern = r'export\s+\{\s*(.+?)\s*\}'
        
        for match in re.finditer(export_pattern, source):
            exported = match.group(1).strip()
            # Handle multiple exports: export { a, b, c }
            names = [name.strip() for name in exported.split(',')]
            exports.extend(names)
        
        return exports
    
    def _parse_with_tree_sitter(self, file_path: Path, source: str) -> Dict[str, Any]:
        """
        Parse TypeScript/JavaScript using tree-sitter.
        
        This would provide more accurate parsing but requires tree-sitter setup.
        """
        # Placeholder for tree-sitter implementation
        # Would require building tree-sitter language grammars
        logger.info(f"Tree-sitter parsing not yet implemented for {file_path}")
        return self._parse_with_regex(file_path, source)

