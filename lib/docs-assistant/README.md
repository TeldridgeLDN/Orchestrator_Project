# Documentation Assistant

Context-aware documentation assistant with ML-powered suggestion ranking.

## Features

- **🎯 Context Detection**: Automatically detects file, task, error, git branch, and command contexts
- **🤖 ML-Powered Ranking**: TF-IDF and cosine similarity for relevance scoring
- **⚡ Fast Response**: <200ms response time
- **🧠 Learning**: Adapts from user feedback
- **📚 Multi-Source**: Indexes files, URLs, and APIs
- **💾 Offline Support**: Local caching for offline operation
- **🐛 Error Parsing**: Intelligent error message parsing
- **📊 Analytics**: Usage tracking and performance metrics

## Architecture

```
DocumentationAssistant (Core)
├── ContextAnalyzer
│   ├── File detection
│   ├── Git branch detection
│   └── Command history
├── SuggestionEngine
│   ├── TF-IDF vectorization
│   ├── Cosine similarity
│   └── Relevance scoring
├── LearningModule
│   ├── Feedback tracking
│   └── Ranking adjustment
├── ErrorParser
│   ├── Python tracebacks
│   ├── JavaScript errors
│   └── Generic patterns
├── DocumentationIndexer
│   ├── File indexing
│   ├── URL indexing
│   └── Search
├── OfflineCache
│   ├── Query caching
│   ├── TTL expiration
│   └── LRU eviction
└── UsageStorage
    ├── SQLite database
    ├── Query history
    └── Feedback tracking
```

## Installation

```bash
# Install dependencies
pip install scikit-learn  # For ML features (optional)

# CLI usage
python -m lib.docs-assistant.cli --help
```

## Usage

### CLI Commands

```bash
# Get suggestions
docs-assist suggest "how to handle errors in python"

# Parse error and get solutions
docs-assist error "ValueError: invalid literal for int()"

# Index documentation
docs-assist index ./docs

# Show statistics
docs-assist stats

# Show current context
docs-assist context
```

### Python API

```python
from lib.docs_assistant import DocumentationAssistant

# Initialize
assistant = DocumentationAssistant()

# Get suggestions
result = assistant.suggest("python async await")

# Display suggestions
for suggestion in result.suggestions:
    print(f"{suggestion.title} ({suggestion.relevance_score:.1%})")
    print(suggestion.content)

# Provide feedback
assistant.provide_feedback(
    suggestion_id=suggestion.id,
    context_hash=result.contexts[0].compute_hash(),
    accepted=True,
    helpful=True
)
```

### Error Parsing

```python
from lib.docs_assistant import ErrorParser

parser = ErrorParser()

error_text = """
Traceback (most recent call last):
  File "test.py", line 10, in process_data
    value = int("not_a_number")
ValueError: invalid literal for int() with base 10: 'not_a_number'
"""

parsed = parser.parse(error_text)

print(f"Type: {parsed.error_type}")
print(f"File: {parsed.file_path}:{parsed.line_number}")
print(f"Language: {parsed.language}")

# Extract keywords for searching
keywords = parser.extract_keywords(parsed)
print(f"Keywords: {keywords}")
```

### Context Detection

```python
from lib.docs_assistant import ContextAnalyzer

analyzer = ContextAnalyzer()

# Auto-detect contexts
contexts = analyzer.analyze()

for ctx in contexts:
    print(f"{ctx.type.value}: {ctx.value}")

# Manual context creation
error_ctx = analyzer.detect_error("TypeError: undefined")
task_ctx = analyzer.detect_task("3.2", "Implement error handling")
```

### Indexing

```python
from lib.docs_assistant import DocumentationIndexer
from pathlib import Path

indexer = DocumentationIndexer()

# Index directory
count = indexer.index_directory(
    Path("./docs"),
    file_patterns=["*.md", "*.rst"]
)
print(f"Indexed {count} documents")

# Index URL content
doc_id = indexer.index_url(
    url="https://example.com/docs/api",
    content="API documentation content...",
    metadata={"category": "api"}
)

# Search index
results = indexer.search("error handling", max_results=5)
```

### Offline Cache

```python
from lib.docs_assistant import OfflineCache

cache = OfflineCache(max_size_mb=100)

# Cache suggestion results
cache.set("query_hash", result.to_dict(), ttl_seconds=3600)

# Retrieve from cache
cached = cache.get("query_hash")

# Get statistics
stats = cache.get_stats()
print(f"Cache: {stats['size_mb']}MB / {stats['max_size_mb']}MB")
```

## Performance Targets

- **Response Time**: <200ms (target: <50ms with cache)
- **Relevance Score**: >0.8 (80%+) for top suggestions
- **Cache Hit Rate**: >60%
- **Indexing Speed**: >100 docs/second
- **Memory Usage**: <50MB baseline

## Configuration

Default paths:
- Index: `~/.docs-assistant/index.json`
- Cache: `~/.docs-assistant/cache.json`
- Database: `~/.docs-assistant/usage.db`

Environment variables:
- `CURRENT_FILE`: Current file for context detection
- `DOCS_ASSISTANT_OFFLINE`: Enable offline mode

## Learning System

The assistant learns from user feedback:

1. **Acceptance Rate**: Tracks which suggestions are accepted
2. **Context Patterns**: Learns context-suggestion associations
3. **Ranking Adjustment**: Boosts/penalizes based on history
4. **Performance Tracking**: Monitors suggestion quality

## Testing

```bash
# Run tests
pytest tests/

# Specific test
pytest tests/test_assistant.py

# With coverage
pytest --cov=lib/docs-assistant tests/
```

## Development

### Adding New Parsers

```python
# In error_parser.py
class ErrorParser:
    def _parse_rust(self, text: str) -> Optional[ParsedError]:
        # Implement Rust error parsing
        pass
```

### Adding Documentation Sources

```python
# In indexer.py
def index_api(self, api_url: str, api_key: str):
    # Implement API documentation indexing
    pass
```

### Custom Context Types

```python
# In models.py
class ContextType(Enum):
    CUSTOM = "custom"

# In context_analyzer.py
def detect_custom(self) -> Context:
    return Context(type=ContextType.CUSTOM, value="...")
```

## Integration

### With Taskmaster

```python
# Auto-detect current task
from lib.docs_assistant import ContextAnalyzer

analyzer = ContextAnalyzer()
task_ctx = analyzer.detect_task("3.1", "Build core engine")

assistant = DocumentationAssistant()
result = assistant.suggest("async programming", contexts=[task_ctx])
```

### With IDEs

Set `CURRENT_FILE` environment variable:

```bash
export CURRENT_FILE="/path/to/current/file.py"
docs-assist suggest "error handling"
```

### Hotkey Integration

```bash
# In your shell config (~/.bashrc, ~/.zshrc)
alias docs='docs-assist suggest'

# Usage
docs "how to handle exceptions"
```

## API Reference

See module docstrings for detailed API documentation:

```python
help(DocumentationAssistant)
help(SuggestionEngine)
help(ContextAnalyzer)
```

## Performance Tips

1. **Enable Caching**: Significantly reduces response time for repeated queries
2. **Build Index**: Index frequently-used documentation for faster lookups
3. **Provide Context**: More context = better suggestions
4. **Give Feedback**: Helps the system learn your preferences

## Troubleshooting

**Slow response times:**
- Check cache hit rate: `docs-assist stats`
- Rebuild index if large: `docs-assist index --rebuild`
- Enable offline mode: `docs-assist --offline suggest ...`

**No suggestions found:**
- Check if documentation is indexed: `docs-assist stats`
- Try broader queries
- Check offline mode is disabled if expecting API results

**Import errors:**
- Install scikit-learn: `pip install scikit-learn`
- Use fallback mode (automatic if sklearn unavailable)

## License

Part of Orchestrator Project - diet103 Integration

## Authors

Development Team - Sprint 4, November 2025

