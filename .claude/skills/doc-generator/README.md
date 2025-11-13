# Skill Documentation Generator

Automated documentation generator for Claude Code skills. Scans skill directories, parses code and metadata, and produces standardized Markdown documentation with drift detection and incremental updates.

## Features

- 🔍 **Directory Scanning** - Recursive skill directory detection
- 📄 **Metadata Extraction** - Parse YAML, JSON, and Python docstrings
- 🐍 **Python Parser** - AST-based code analysis
- ⚛️ **TypeScript/JavaScript Parser** - Tree-sitter + regex fallback
- 📝 **Jinja2 Templates** - Beautiful Markdown generation
- 🔄 **Drift Detection** - Compare generated vs existing docs
- 💾 **Incremental Updates** - Preserve manual edits
- 🔌 **Extensible Parsers** - Easy addition of new languages
- ⚙️ **Configuration** - JSON-based settings management

## Installation

```bash
cd .claude/skills/doc-generator
pip install -r requirements.txt
```

## Quick Start

```bash
# Generate docs for all skills
python cli.py --all

# Generate docs for specific skill
python cli.py --skill pe-compression-analysis

# Check drift for all skills
python cli.py --check-drift-all

# Update skill docs incrementally
python cli.py --update --skill pe-compression-analysis

# Dry-run incremental update
python cli.py --update-all --dry-run
```

## CLI Commands

### Generation
- `--all` - Generate docs for all skills
- `--skill <name>` - Generate docs for specific skill
- `--output <dir>` - Custom output directory

### Drift Detection
- `--check-drift --skill <name>` - Check drift for specific skill
- `--check-drift-all` - Check drift for all skills

### Incremental Updates
- `--update --skill <name>` - Update specific skill
- `--update-all` - Update all skills
- `--replace-all` - Replace all sections (no preservation)
- `--dry-run` - Preview changes without writing

### Configuration
- `--skills-dir <dir>` - Override skills directory
- `--config <file>` - Use custom config file
- `--verbose, -v` - Verbose output
- `--quiet, -q` - Quiet mode (errors only)

## File Structure

```
doc-generator/
├── cli.py                  # Main CLI entry point
├── config.json            # Configuration file
├── config_manager.py      # Configuration manager
├── doc_generator.py       # Main documentation generator
├── scanner.py             # Directory scanner
├── metadata_extractor.py  # Metadata extraction
├── drift_detector.py      # Drift detection
├── incremental_updater.py # Incremental updates
├── parsers/               # Language parsers
│   ├── __init__.py
│   ├── base_parser.py
│   ├── python_parser.py
│   ├── typescript_parser.py
│   ├── parser_registry.py
│   └── README.md
├── templates/             # Jinja2 templates
│   └── skill-template.md.j2
└── tests/                 # Test suite
    ├── test_scanner.py
    ├── test_metadata_extractor.py
    ├── test_python_parser.py
    ├── test_typescript_parser.py
    ├── test_drift_detector.py
    ├── test_incremental_updater.py
    ├── test_parser_registry.py
    └── test_config_manager.py
```

## Configuration

Edit `config.json` to customize:

```json
{
  "paths": {
    "skills_dir": ".claude/skills",
    "templates_dir": "templates"
  },
  "templates": {
    "default": "skill-template.md.j2"
  },
  "parsing": {
    "python": {"enabled": true},
    "typescript": {"enabled": true}
  },
  "drift_detection": {
    "enabled": true,
    "auto_backup": true
  },
  "incremental_updates": {
    "preserve_manual_edits": true
  }
}
```

## Adding New Languages

1. Create parser class:

```python
from parsers.base_parser import BaseParser

class RustParser(BaseParser):
    def parse_file(self, file_path):
        # Implementation
        pass
    
    def supports_file(self, file_path):
        return file_path.suffix == '.rs'
    
    def get_supported_extensions(self):
        return ['.rs']
```

2. Register parser:

```python
from parsers import register_parser
register_parser('rust', RustParser())
```

See `parsers/README.md` for detailed guide.

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_scanner.py -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

## Manual Edit Preservation

Use special markers to protect manual edits:

```markdown
<!-- MANUAL EDIT START -->
## Custom Section
This content will be preserved during updates.
<!-- MANUAL EDIT END -->
```

Mark sections as auto-generated for replacement:

```markdown
<!-- AUTO-GENERATED: DO NOT EDIT -->
## Configuration
This section will be replaced during updates.
```

## Performance

- **Generation**: <5s for all skills
- **Parsing**: <0.1s per file
- **Drift Detection**: <0.1s per 1000-line doc
- **Incremental Update**: <0.1s per doc

## Troubleshooting

### tree-sitter not available

The TypeScript parser falls back to regex if tree-sitter is unavailable. To install:

```bash
pip install tree-sitter
```

### Config file not found

If `config.json` is missing, the generator uses default values. Create one with:

```bash
cp config.json.example config.json
```

### Permission denied

Ensure the generator has write access to the skills directory.

## Development

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run linter
pylint *.py parsers/*.py

# Run type checker
mypy *.py

# Format code
black *.py parsers/*.py tests/*.py
```

## License

MIT License - see parent project for details.

## Credits

Part of the Orchestrator Project - Sprint 3 deliverables.

