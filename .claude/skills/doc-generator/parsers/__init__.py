"""
Parsers Package

Multi-language parser system for extracting code metadata.

Usage:
    from parsers import get_global_registry, register_parser
    
    # Get parser for a file
    parser = get_global_registry().get_parser(file_path)
    result = parser.parse_file(file_path)
    
    # Register custom parser
    register_parser('rust', RustParser())
"""

from .base_parser import BaseParser
from .python_parser import PythonParser
from .typescript_parser import TypeScriptParser
from .parser_registry import (
    ParserRegistry,
    get_global_registry,
    register_parser,
    get_parser_for_file,
    parse_file
)

__all__ = [
    'BaseParser',
    'PythonParser',
    'TypeScriptParser',
    'ParserRegistry',
    'get_global_registry',
    'register_parser',
    'get_parser_for_file',
    'parse_file'
]
