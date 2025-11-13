"""
Tests for parser_registry module
"""

import pytest
from pathlib import Path
import tempfile
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from parsers.parser_registry import ParserRegistry, get_global_registry
from parsers.base_parser import BaseParser
from parsers.python_parser import PythonParser
from parsers.typescript_parser import TypeScriptParser


class MockParser(BaseParser):
    """Mock parser for testing."""
    
    def __init__(self, extensions):
        self.extensions = extensions
    
    def parse_file(self, file_path: Path):
        return {
            "file": file_path.name,
            "path": str(file_path),
            "language": "mock",
            "classes": [],
            "functions": []
        }
    
    def supports_file(self, file_path: Path) -> bool:
        return file_path.suffix in self.extensions
    
    def get_supported_extensions(self):
        return self.extensions


class TestParserRegistry:
    """Test cases for ParserRegistry."""
    
    def test_registry_initialization(self):
        """Test that registry initializes correctly."""
        registry = ParserRegistry()
        assert registry is not None
        assert len(registry.list_parsers()) == 0
    
    def test_register_parser(self):
        """Test registering a parser."""
        registry = ParserRegistry()
        parser = MockParser(['.mock'])
        
        registry.register('mock', parser)
        
        assert 'mock' in registry.list_parsers()
        assert '.mock' in registry.get_supported_extensions()
    
    def test_register_multiple_parsers(self):
        """Test registering multiple parsers."""
        registry = ParserRegistry()
        
        registry.register('mock1', MockParser(['.m1']))
        registry.register('mock2', MockParser(['.m2']))
        
        assert len(registry.list_parsers()) == 2
        assert '.m1' in registry.get_supported_extensions()
        assert '.m2' in registry.get_supported_extensions()
    
    def test_get_parser_by_extension(self):
        """Test getting parser by file extension."""
        registry = ParserRegistry()
        parser = MockParser(['.mock'])
        registry.register('mock', parser)
        
        result = registry.get_parser(Path('test.mock'))
        
        assert result is parser
    
    def test_get_parser_by_name(self):
        """Test getting parser by name."""
        registry = ParserRegistry()
        parser = MockParser(['.mock'])
        registry.register('mock', parser)
        
        result = registry.get_parser_by_name('mock')
        
        assert result is parser
    
    def test_get_parser_nonexistent(self):
        """Test getting parser for unsupported extension."""
        registry = ParserRegistry()
        
        result = registry.get_parser(Path('test.xyz'))
        
        assert result is None
    
    def test_fallback_parser(self):
        """Test fallback parser."""
        registry = ParserRegistry()
        fallback = MockParser([])  # Supports nothing by extension
        registry.register_fallback(fallback)
        
        result = registry.get_parser(Path('test.xyz'))
        
        assert result is fallback
    
    def test_extension_override_warning(self, caplog):
        """Test warning when extension is overridden."""
        registry = ParserRegistry()
        
        registry.register('mock1', MockParser(['.dup']))
        registry.register('mock2', MockParser(['.dup']))  # Override
        
        assert 'overriding' in caplog.text.lower()
    
    def test_parse_file(self):
        """Test parsing file through registry."""
        registry = ParserRegistry()
        parser = MockParser(['.mock'])
        registry.register('mock', parser)
        
        with tempfile.NamedTemporaryFile(suffix='.mock', delete=False) as f:
            f.write(b'test content')
            temp_path = Path(f.name)
        
        try:
            result = registry.parse_file(temp_path)
            
            assert result is not None
            assert result['language'] == 'mock'
            assert result['file'] == temp_path.name
        finally:
            temp_path.unlink()
    
    def test_parse_file_no_parser(self):
        """Test parsing file with no parser."""
        registry = ParserRegistry()
        
        result = registry.parse_file(Path('test.xyz'))
        
        assert result is None
    
    def test_supports_file_check(self):
        """Test parser selection via supports_file()."""
        class CustomParser(MockParser):
            def supports_file(self, file_path: Path) -> bool:
                return 'custom' in file_path.name
        
        registry = ParserRegistry()
        registry.register('custom', CustomParser([]))
        
        result = registry.get_parser(Path('my-custom-file.txt'))
        
        assert result is not None


class TestGlobalRegistry:
    """Test cases for global registry."""
    
    def test_global_registry_singleton(self):
        """Test that global registry is a singleton."""
        reg1 = get_global_registry()
        reg2 = get_global_registry()
        
        assert reg1 is reg2
    
    def test_default_parsers_registered(self):
        """Test that default parsers are registered."""
        registry = get_global_registry()
        
        assert 'python' in registry.list_parsers()
        assert 'typescript' in registry.list_parsers()
    
    def test_python_extension_support(self):
        """Test Python extensions are supported."""
        registry = get_global_registry()
        
        assert '.py' in registry.get_supported_extensions()
    
    def test_typescript_extension_support(self):
        """Test TypeScript/JS extensions are supported."""
        registry = get_global_registry()
        
        exts = registry.get_supported_extensions()
        assert '.ts' in exts or '.js' in exts
    
    def test_parse_python_file(self):
        """Test parsing a Python file through global registry."""
        with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
            f.write('def test():\n    """Test function"""\n    pass\n')
            temp_path = Path(f.name)
        
        try:
            registry = get_global_registry()
            result = registry.parse_file(temp_path)
            
            assert result is not None
            assert result['language'] == 'python'
            assert len(result['functions']) > 0
        finally:
            temp_path.unlink()
    
    def test_parse_javascript_file(self):
        """Test parsing a JavaScript file through global registry."""
        with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False) as f:
            f.write('function test() {\n  return true;\n}\n')
            temp_path = Path(f.name)
        
        try:
            registry = get_global_registry()
            result = registry.parse_file(temp_path)
            
            assert result is not None
            assert result['language'] in ['javascript', 'typescript']
        finally:
            temp_path.unlink()


class TestParserInterface:
    """Test that built-in parsers conform to interface."""
    
    def test_python_parser_interface(self):
        """Test PythonParser implements BaseParser."""
        parser = PythonParser()
        
        assert hasattr(parser, 'parse_file')
        assert hasattr(parser, 'supports_file')
        assert hasattr(parser, 'get_supported_extensions')
        assert callable(parser.parse_file)
        assert callable(parser.supports_file)
        assert callable(parser.get_supported_extensions)
    
    def test_typescript_parser_interface(self):
        """Test TypeScriptParser implements BaseParser."""
        parser = TypeScriptParser()
        
        assert hasattr(parser, 'parse_file')
        assert hasattr(parser, 'supports_file')
        assert hasattr(parser, 'get_supported_extensions')
        assert callable(parser.parse_file)
        assert callable(parser.supports_file)
        assert callable(parser.get_supported_extensions)
    
    def test_python_parser_extensions(self):
        """Test PythonParser returns correct extensions."""
        parser = PythonParser()
        exts = parser.get_supported_extensions()
        
        assert isinstance(exts, list)
        assert '.py' in exts
    
    def test_typescript_parser_extensions(self):
        """Test TypeScriptParser returns correct extensions."""
        parser = TypeScriptParser()
        exts = parser.get_supported_extensions()
        
        assert isinstance(exts, list)
        assert any(ext in exts for ext in ['.ts', '.js', '.tsx', '.jsx'])


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

