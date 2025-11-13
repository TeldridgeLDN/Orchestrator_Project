"""
Parser Registry

Central registry for managing and discovering language-specific parsers.
Provides a plug-and-play system for adding new language support.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Type
from .base_parser import BaseParser

logger = logging.getLogger(__name__)


class ParserRegistry:
    """
    Registry for managing language-specific parsers.
    
    Features:
    - Auto-discovery of parsers
    - Extension-based parser selection
    - Fallback parser support
    - Easy registration of new parsers
    """
    
    def __init__(self):
        self._parsers: Dict[str, BaseParser] = {}
        self._extension_map: Dict[str, str] = {}
        self._fallback_parser: Optional[BaseParser] = None
    
    def register(self, name: str, parser: BaseParser):
        """
        Register a parser.
        
        Args:
            name: Unique name for the parser (e.g., 'python', 'typescript')
            parser: Parser instance
        """
        self._parsers[name] = parser
        
        # Update extension map
        for ext in parser.get_supported_extensions():
            if ext in self._extension_map:
                logger.warning(f"Extension {ext} already mapped to {self._extension_map[ext]}, overriding with {name}")
            self._extension_map[ext] = name
        
        logger.info(f"Registered parser '{name}' for extensions: {parser.get_supported_extensions()}")
    
    def register_fallback(self, parser: BaseParser):
        """
        Register a fallback parser for unsupported file types.
        
        Args:
            parser: Fallback parser instance
        """
        self._fallback_parser = parser
        logger.info(f"Registered fallback parser: {parser.__class__.__name__}")
    
    def get_parser(self, file_path: Path) -> Optional[BaseParser]:
        """
        Get the appropriate parser for a file.
        
        Args:
            file_path: Path to the file
        
        Returns:
            Parser instance or None if no parser available
        """
        # Try extension-based lookup first
        ext = file_path.suffix.lower()
        if ext in self._extension_map:
            parser_name = self._extension_map[ext]
            return self._parsers.get(parser_name)
        
        # Try asking each parser if it supports the file
        for parser in self._parsers.values():
            if parser.supports_file(file_path):
                return parser
        
        # Return fallback if available
        if self._fallback_parser:
            logger.debug(f"Using fallback parser for {file_path}")
            return self._fallback_parser
        
        logger.warning(f"No parser found for {file_path}")
        return None
    
    def get_parser_by_name(self, name: str) -> Optional[BaseParser]:
        """
        Get a parser by its registered name.
        
        Args:
            name: Parser name
        
        Returns:
            Parser instance or None
        """
        return self._parsers.get(name)
    
    def list_parsers(self) -> List[str]:
        """
        List all registered parser names.
        
        Returns:
            List of parser names
        """
        return list(self._parsers.keys())
    
    def get_supported_extensions(self) -> List[str]:
        """
        Get all supported file extensions.
        
        Returns:
            List of extensions
        """
        return list(self._extension_map.keys())
    
    def parse_file(self, file_path: Path) -> Optional[Dict]:
        """
        Parse a file using the appropriate parser.
        
        Args:
            file_path: Path to the file
        
        Returns:
            Parsed metadata or None
        """
        parser = self.get_parser(file_path)
        if not parser:
            return None
        
        try:
            return parser.parse_file(file_path)
        except Exception as e:
            logger.error(f"Error parsing {file_path} with {parser.__class__.__name__}: {e}")
            return None


# Global registry instance
_global_registry = None


def get_global_registry() -> ParserRegistry:
    """
    Get the global parser registry.
    
    Returns:
        Global ParserRegistry instance
    """
    global _global_registry
    if _global_registry is None:
        _global_registry = ParserRegistry()
        _initialize_default_parsers()
    return _global_registry


def _initialize_default_parsers():
    """Initialize the global registry with default parsers."""
    from .python_parser import PythonParser
    from .typescript_parser import TypeScriptParser
    
    registry = _global_registry
    
    # Register built-in parsers
    registry.register('python', PythonParser())
    registry.register('typescript', TypeScriptParser())
    
    logger.info("Initialized default parsers")


def register_parser(name: str, parser: BaseParser):
    """
    Convenience function to register a parser globally.
    
    Args:
        name: Parser name
        parser: Parser instance
    """
    get_global_registry().register(name, parser)


def get_parser_for_file(file_path: Path) -> Optional[BaseParser]:
    """
    Convenience function to get parser for a file.
    
    Args:
        file_path: Path to the file
    
    Returns:
        Parser instance or None
    """
    return get_global_registry().get_parser(file_path)


def parse_file(file_path: Path) -> Optional[Dict]:
    """
    Convenience function to parse a file.
    
    Args:
        file_path: Path to the file
    
    Returns:
        Parsed metadata or None
    """
    return get_global_registry().parse_file(file_path)

