# Parser System Documentation

## Overview

The parser system provides a modular, extensible architecture for parsing multiple programming languages. It uses an abstract base class pattern with a central registry for managing parsers.

## Architecture

```
parsers/
├── base_parser.py          # Abstract base class (ABC)
├── parser_registry.py      # Central registry & factory
├── python_parser.py        # Python implementation
├── typescript_parser.py    # TypeScript/JavaScript implementation
└── README.md              # This file
```

## Core Components

### 1. BaseParser (Abstract Base Class)

All language-specific parsers must inherit from `BaseParser` and implement:

**Required Methods:**
- `parse_file(file_path: Path) -> Dict[str, Any]` - Parse a source file
- `supports_file(file_path: Path) -> bool` - Check if parser supports file
- `get_supported_extensions() -> List[str]` - Return supported extensions

**Optional Methods:**
- `extract_signature(node: Any) -> str` - Extract function signature
- `extract_docstring(node: Any) -> str` - Extract docstring

**Standard Return Format:**
```python
{
    "file": str,              # Filename
    "path": str,              # Relative path
    "language": str,          # Language name
    "module_docstring": str,  # Top-level documentation
    "classes": [              # List of classes
        {
            "name": str,
            "docstring": str,
            "line": int,
            "methods": [...]
        }
    ],
    "functions": [            # List of functions
        {
            "name": str,
            "docstring": str,
            "line": int,
            "args": [...]
        }
    ],
    "imports": [str],         # List of imports
    "exports": [str]          # List of exports (if applicable)
}
```

### 2. ParserRegistry (Factory & Manager)

Central registry for managing parsers:

**Features:**
- Extension-based parser selection
- Fallback parser support
- Runtime parser registration
- Global singleton instance

**Usage:**
```python
from parsers import get_global_registry, register_parser

# Get the global registry
registry = get_global_registry()

# Register a custom parser
registry.register('rust', RustParser())

# Parse a file
result = registry.parse_file(Path('src/main.rs'))
```

### 3. Built-in Parsers

#### Python Parser
- Uses Python's built-in `ast` module
- Extracts classes, functions, methods, docstrings, imports
- Handles nested functions and class methods
- Supports `.py` and `.pyi` files

**Example:**
```python
from parsers.python_parser import PythonParser

parser = PythonParser()
result = parser.parse_file(Path('skill.py'))
```

#### TypeScript/JavaScript Parser
- Dual-mode: tree-sitter (preferred) + regex fallback
- Extracts classes, methods, functions, JSDoc comments
- Handles ES6+ syntax, imports, exports
- Supports `.ts`, `.tsx`, `.js`, `.jsx` files

**Example:**
```python
from parsers.typescript_parser import TypeScriptParser

parser = TypeScriptParser()
result = parser.parse_file(Path('skill.ts'))
```

## Adding a New Language

### Step 1: Create Parser Class

Create a new file `parsers/your_language_parser.py`:

```python
from pathlib import Path
from typing import Dict, Any, List
from .base_parser import BaseParser

class YourLanguageParser(BaseParser):
    """Parser for Your Language."""
    
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a Your Language file."""
        # Implementation here
        return {
            "file": file_path.name,
            "path": str(file_path),
            "language": "your-language",
            "module_docstring": "",
            "classes": [],
            "functions": [],
            "imports": []
        }
    
    def supports_file(self, file_path: Path) -> bool:
        """Check if file is a Your Language file."""
        return file_path.suffix.lower() in self.get_supported_extensions()
    
    def get_supported_extensions(self) -> List[str]:
        """Return supported extensions."""
        return ['.yourlang', '.yl']
```

### Step 2: Register Parser

#### Option A: Modify `parser_registry.py`

Add to `_initialize_default_parsers()`:

```python
def _initialize_default_parsers():
    from .python_parser import PythonParser
    from .typescript_parser import TypeScriptParser
    from .your_language_parser import YourLanguageParser
    
    registry = _global_registry
    registry.register('python', PythonParser())
    registry.register('typescript', TypeScriptParser())
    registry.register('your-language', YourLanguageParser())  # Add this
```

#### Option B: Register at Runtime

```python
from parsers import register_parser
from my_parsers import YourLanguageParser

register_parser('your-language', YourLanguageParser())
```

### Step 3: Test

Create `tests/test_your_language_parser.py`:

```python
import pytest
from pathlib import Path
from parsers.your_language_parser import YourLanguageParser

def test_parse_sample_file():
    parser = YourLanguageParser()
    result = parser.parse_file(Path('test.yourlang'))
    
    assert result is not None
    assert result['language'] == 'your-language'
    assert 'functions' in result
```

## Best Practices

### 1. Error Handling

Always handle parsing errors gracefully:

```python
def parse_file(self, file_path: Path) -> Dict[str, Any]:
    try:
        # Parsing logic
        pass
    except Exception as e:
        logger.error(f"Error parsing {file_path}: {e}")
        return {
            "file": file_path.name,
            "path": str(file_path),
            "error": str(e)
        }
```

### 2. Logging

Use Python's logging module:

```python
import logging
logger = logging.getLogger(__name__)

def parse_file(self, file_path: Path) -> Dict[str, Any]:
    logger.info(f"Parsing {file_path}")
    # ... parsing logic ...
    logger.debug(f"Found {len(functions)} functions")
```

### 3. Performance

For large files, consider:
- Streaming/chunking
- Caching parsed results
- Lazy loading of imports

### 4. Standard Format

Always return data in the standard format for consistency with templates.

## Integration with Doc Generator

The doc generator automatically uses the parser registry:

```python
from doc_generator import DocGenerator
from parsers import register_parser, YourLanguageParser

# Register custom parser
register_parser('your-language', YourLanguageParser())

# Generate docs (will automatically use your parser)
generator = DocGenerator()
generator.generate_all()
```

## Parser Selection Flow

```
1. File Extension Match
   ├─ .py → PythonParser
   ├─ .ts/.js → TypeScriptParser
   └─ .yourlang → YourLanguageParser

2. Parser supports_file() Check
   └─ Ask each parser if it supports the file

3. Fallback Parser (if registered)
   └─ Use generic/fallback parser

4. None
   └─ Skip file or log warning
```

## Advanced Features

### Custom Metadata

Parsers can include custom metadata:

```python
return {
    # ... standard fields ...
    "custom_metadata": {
        "your_field": "value",
        "complexity": 5
    }
}
```

### Multi-Pass Parsing

For complex analysis:

```python
def parse_file(self, file_path: Path) -> Dict[str, Any]:
    # Pass 1: Basic structure
    structure = self._extract_structure(file_path)
    
    # Pass 2: Resolve references
    resolved = self._resolve_references(structure)
    
    # Pass 3: Extract documentation
    return self._extract_docs(resolved)
```

### Incremental Parsing

For large codebases:

```python
class IncrementalParser(BaseParser):
    def __init__(self):
        self._cache = {}
    
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        # Check cache
        if file_path in self._cache:
            if not self._has_changed(file_path):
                return self._cache[file_path]
        
        # Parse and cache
        result = self._do_parse(file_path)
        self._cache[file_path] = result
        return result
```

## Testing

Run all parser tests:

```bash
pytest tests/test_*_parser.py -v
```

Test specific parser:

```bash
pytest tests/test_python_parser.py -v
```

## Troubleshooting

### Parser Not Found

```python
# Check registered parsers
from parsers import get_global_registry
print(get_global_registry().list_parsers())
print(get_global_registry().get_supported_extensions())
```

### Parse Errors

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Extension Conflicts

Check extension mapping:

```python
registry = get_global_registry()
print(registry._extension_map)
```

## Future Enhancements

Potential improvements:
- AST caching for faster re-parsing
- Parallel parsing for multiple files
- Plugin system for parser discovery
- Configuration-driven parser selection
- Language detection without extensions
- Cross-language reference resolution

## Contributing

When adding a new parser:
1. Follow the BaseParser interface
2. Include comprehensive tests
3. Update this README
4. Add example usage
5. Document any language-specific quirks

## License

Same as parent project.

