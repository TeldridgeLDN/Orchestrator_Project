"""
Base Parser Interface

Abstract base class for language-specific parsers.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List


class BaseParser(ABC):
    """
    Abstract base class for code parsers.
    
    All language-specific parsers must implement this interface.
    """
    
    @abstractmethod
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse a source file and extract metadata.
        
        Args:
            file_path: Path to the source file
        
        Returns:
            Dictionary with parsed metadata including:
            - file: filename
            - path: relative path
            - module_docstring: top-level documentation
            - classes: list of class definitions
            - functions: list of function definitions
            - imports: list of import statements
        """
        pass
    
    @abstractmethod
    def supports_file(self, file_path: Path) -> bool:
        """
        Check if this parser supports the given file.
        
        Args:
            file_path: Path to check
        
        Returns:
            True if this parser can handle the file
        """
        pass
    
    @abstractmethod
    def get_supported_extensions(self) -> List[str]:
        """
        Get list of file extensions this parser supports.
        
        Returns:
            List of extensions (e.g., ['.py', '.pyi'])
        """
        pass
    
    def extract_signature(self, node: Any) -> str:
        """
        Extract function/method signature as a string.
        
        Args:
            node: AST node representing function/method
        
        Returns:
            String representation of signature
        """
        return ""
    
    def extract_docstring(self, node: Any) -> str:
        """
        Extract docstring from a node.
        
        Args:
            node: AST node
        
        Returns:
            Docstring text or empty string
        """
        return ""

