# P/E Compression Analysis Skill

**Version**: 0.1.0**Author**: Momentum Squared**Created**: 2025-11-13
## Overview

Advanced P/E compression detection and analysis skill with multi-mode operation, keyword detection, and Workflow 9 integration


**Category**: financial-analysis

---

## Capabilities

### Keyword Detection

- **Enabled**: True
- **Accuracy**: 100%
- **Performance**: <0.01s
- **Methods**: ['spacy', 'regex']
- **Patterns**: ['p/e compression', 'pe compression', 'comparative pe', 'valuation']

### Operational Modes

- **Basic**: {'description': 'Static industry data analysis', 'requirements': [], 'capabilities': ['industry_comparison', 'compression_detection']}
- **Full**: {'description': 'Live data with Perplexity API', 'requirements': ['PERPLEXITY_API_KEY'], 'capabilities': ['live_data', 'peer_comparison', 'enhanced_analysis']}
- **Offline**: {'description': 'Cached data analysis', 'requirements': ['local_cache'], 'capabilities': ['cached_data', 'offline_operation']}

### Mode Selection

- **Automatic**: True
- **Performance**: <0.1s
- **Based On**: ['api_key_availability', 'cache_availability', 'user_preference']

### Output Formats

- **Json**: True
- **Markdown**: True
- **Decision Framework**: True


---

## Dependencies

**Python**: >=3.8

### Required Packages

- `spacy`: ~=3.7
- `pandas`: ~=2.2
- `pytest`: ~=7.x
- `pytest-cov`: ~=7.0

### External Skills

- **workflow9-executor**: >=1.0.0
  - Purpose: Workflow automation integration
  - Required: No

---

## Configuration

### Environment Variables

- **PERPLEXITY_API_KEY**
  - Required: No
  - Description: API key for Perplexity AI (enables Full mode)

### Settings

- **Default Mode**: auto
- **Prefer Offline**: False
- **Strict Validation**: True
- **Cache Directory**: .cache/pe-compression

---

## File Structure

```
P/E Compression Analysis Skill/
├── src/
│   ├── core
│   ├── nlp
│   ├── modes
│   ├── integration
│   ├── utils
├── tests/
│   ├── test_imports.py
│   ├── test_keyword_detector.py
│   ├── test_modes.py
│   ├── test_mode_selector.py
│   ├── test_markdown_renderer.py
│   ├── test_workflow9_connector.py
├── docs/
│   ├── README.md
│   ├── API.md
├── config/
│   ├── requirements.txt
│   ├── setup.py
│   ├── pytest.ini
│   ├── .gitignore
```

---

## API Reference

### Python Modules

#### setup.py

Setup configuration for P/E Compression Analysis Skill.



#### __init__.py

Test suite for P/E Compression Analysis Skill.



#### __init__.py

P/E Compression Analysis Skill

This package provides automated P/E compression analysis with intelligent
mode selection, robust keyword activation, and seamless workflow integration.

Modules:
    - core: Main analysis logic and orchestration
    - nlp: spaCy-based keyword detection
    - modes: Operational mode implementations (Basic, Full, Offline)
    - integration: Workflow 9 integration interface
    - utils: Utility functions and helpers



#### analyzer.py

Main P/E Compression Analyzer orchestration class.

This module coordinates keyword detection, mode selection, analysis execution,
and result formatting into a cohesive analysis workflow.

##### Classes

###### `PECompressionAnalyzer`

Main orchestrator for P/E Compression Analysis.

This class coordinates the entire analysis workflow:
1. Keyword detection to trigger analysis
2. Mode selection based on environment
3. Analysis execution in selected mode
4. Result formatting and decision framework rendering
5. Integration with Workflow 9

**Methods:**

- `__init__(self)`
  - Initialize the P/E Compression Analyzer.
- `analyze(self, input_text, force_mode)`
  - Execute P/E compression analysis.

Args:
    input_text: User input text to analyze
   ...
- `_execute_analysis(self, mode, input_text)`
  - Execute the actual P/E compression analysis.

Args:
    mode: Selected operational mode
   ...

---



#### __init__.py

Core analysis logic and orchestration for P/E Compression Analysis.

This module provides the main analyzer class that coordinates keyword detection,
mode selection, analysis execution, and result formatting.



#### basic_mode.py

Basic mode implementation - no external API required.

This module provides P/E compression analysis using only
built-in functionality without external dependencies.

##### Classes

###### `BasicMode`

Basic operational mode for P/E compression analysis.

This mode operates without external APIs, providing
fundamental analysis capabilities using built-in logic
and local data structures.

**Methods:**

- `__init__(self)`
  - Initialize Basic mode.
- `analyze(self, input_data)`
  - Execute P/E compression analysis in Basic mode.

Args:
    input_data: Analysis input parameters...
- `get_industry_average(self, industry)`
  - Get industry average P/E ratio.

Args:
    industry: Industry sector name

Returns:
    Average...
- `detect_compression(self, current_pe, historical_pe, threshold)`
  - Detect if P/E compression has occurred.

Args:
    current_pe: Current P/E ratio
   ...

---



#### full_mode.py

Full mode implementation with Perplexity API integration.

This module provides enhanced P/E compression analysis
using live data from the Perplexity API.

##### Classes

###### `FullMode`

Full operational mode with Perplexity API integration.

This mode provides the most comprehensive analysis by
leveraging external API for real-time data, market context,
and enhanced insights beyond Basic mode capabilities.

**Methods:**

- `__init__(self)`
  - Initialize Full mode.
- `analyze(self, input_data)`
  - Execute P/E compression analysis in Full mode.

Args:
    input_data: Analysis input parameters...
- `_fetch_api_data(self, symbol, include_peers)`
  - Fetch real-time data from Perplexity API.

Args:
    symbol: Stock symbol to analyze
   ...
- `_enhance_analysis(self, basic_results, api_data)`
  - Enhance basic analysis with API data insights.

Args:
    basic_results: Results from basic mode...
- `test_api_connection(self)`
  - Test Perplexity API connection and availability.

Returns:
    Connection test results

---



#### offline_mode.py

Offline mode implementation using cached data.

This module provides P/E compression analysis using
previously cached data without requiring network access.

##### Classes

###### `OfflineMode`

Offline operational mode using cached data.

This mode operates entirely from local cache, making it
suitable for offline environments or when API access is unavailable.
Combines Basic mode logic with cached historical data.

**Methods:**

- `__init__(self, cache_dir)`
  - Initialize Offline mode.

Args:
    cache_dir: Custom cache directory path (optional)
- `analyze(self, input_data)`
  - Execute P/E compression analysis in Offline mode.

Args:
    input_data: Analysis input...
- `_load_cache(self)`
  - Load cached data from JSON file.

Returns:
    Dictionary containing cached P/E data
- `_get_cached_data(self, symbol)`
  - Get cached data for a specific symbol.

Args:
    symbol: Stock symbol to look up

Returns:
   ...
- `_analyze_cache_data(self, basic_results, cache_data)`
  - Analyze cached data and create additional insights.

Args:
    basic_results: Results from basic...
- `_calculate_cache_age(self, cache_timestamp)`
  - Calculate how old the cached data is.

Args:
    cache_timestamp: ISO format timestamp...
- `update_cache(self, symbol, data)`
  - Update cache with new data for a symbol.

Args:
    symbol: Stock symbol
    data: Data to...
- `get_cache_info(self)`
  - Get information about the cache status.

Returns:
    Dictionary with cache information

---



#### __init__.py

Operational mode implementations and mode selection logic.

This module provides three operational modes:
    - Basic: No external API required
    - Full: Integrated with Perplexity API
    - Offline: Uses cached data only

The ModeSelector automatically chooses the optimal mode based on environment.



#### mode_selector.py

Mode selection logic for P/E Compression Analysis.

This module determines the optimal operational mode based on
environment state and available resources.

##### Classes

###### `AnalysisMode`

Operational modes for P/E Compression Analysis.


---

###### `ModeSelector`

Selects the optimal operational mode based on environment.

Selection criteria:
- Full mode: PERPLEXITY_API_KEY present and valid
- Offline mode: Cache available, no API key
- Basic mode: Fallback when other modes unavailable

Performance target: <2s mode selection time

**Methods:**

- `__init__(self, prefer_offline)`
  - Initialize the mode selector.

Args:
    prefer_offline: If True, prefer Offline mode over Full...
- `select_mode(self, force_refresh)`
  - Automatically select the optimal operational mode.

Uses cached environment state for...
- `get_mode_suggestion(self, force_refresh)`
  - Get comprehensive mode selection suggestion with reasoning.

Args:
    force_refresh: Force...
- `_get_env_state(self, force_refresh)`
  - Get environment state with caching for performance.

Args:
    force_refresh: Force refresh of...
- `_get_available_modes(self, env_state)`
  - Get list of available modes based on environment.

Args:
    env_state: Current environment...
- `_get_recommendation(self, mode, env_state)`
  - Generate user-facing recommendation based on mode selection.

Args:
    mode: Selected mode
   ...
- `_get_alternatives(self, selected_mode, available_modes)`
  - Get alternative mode recommendations.

Args:
    selected_mode: Currently selected mode
   ...
- `validate_mode(self, mode)`
  - Validate if a specific mode can be used.

Args:
    mode: Mode to validate

Returns:
   ...
- `get_selection_performance(self)`
  - Get performance metrics for mode selection.

Returns:
    Performance metrics dictionary

---



#### __init__.py

Integration interface for Workflow 9 Execution Skill.

This module provides a well-defined interface for seamless integration
with the Workflow 9 Execution Skill from Sprint 1.



#### workflow9_connector.py

Integration connector for Workflow 9 Execution Skill.

This module provides a robust, versioned interface for the P/E Compression Analysis Skill
to integrate seamlessly with the Workflow 9 Execution Skill.

Interface Version: 1.0.0

##### Classes

###### `Workflow9InterfaceError`

Custom exception for Workflow 9 integration errors.


---

###### `Workflow9Connector`

Connector for integrating with Workflow 9 Execution Skill.

Provides a well-defined, versioned interface with clear input/output contracts
for seamless integration with downstream workflow execution.

Interface Contract:
- Version: 1.0.0
- Input: P/E compression analysis results dictionary
- Output: Formatted workflow action package with metadata
- Error Handling: Comprehensive validation and error reporting

**Methods:**

- `__init__(self, output_format, strict_validation)`
  - Initialize the Workflow 9 connector.

Args:
    output_format: Output format ("json",...
- `prepare_workflow_action(self, analysis_results, markdown_output)`
  - Prepare analysis results for Workflow 9 consumption.

This is the primary integration method...
- `_build_metadata(self)`
  - Build metadata section for workflow routing and versioning.

Returns:
    Metadata dictionary
- `_extract_analysis_data(self, results)`
  - Extract and structure core analysis data.

Args:
    results: Raw analysis results

Returns:
   ...
- `_build_decision_framework(self, results)`
  - Build decision support framework from analysis results.

Args:
    results: Raw analysis...
- `_generate_workflow_actions(self, results)`
  - Generate suggested workflow actions based on analysis results.

Args:
    results: Raw analysis...
- `_format_outputs(self, results, markdown_output)`
  - Format outputs according to configured output format.

Args:
    results: Raw analysis results
 ...
- `_determine_status(self, results)`
  - Determine overall analysis status.

Args:
    results: Analysis results

Returns:
    Status...
- `_assess_severity(self, results)`
  - Assess compression severity.

Args:
    results: Analysis results

Returns:
    Severity level...
- `_assess_confidence(self, results)`
  - Assess analysis confidence based on mode and data quality.

Args:
    results: Analysis...
- `_extract_risk_factors(self, results)`
  - Extract risk factors from analysis.

Args:
    results: Analysis results

Returns:
    List of...
- `_generate_next_actions(self, results)`
  - Generate specific next actions.

Args:
    results: Analysis results

Returns:
    List of next actions
- `_generate_simple_markdown(self, results)`
  - Generate simple Markdown output if full renderer not available.

Args:
    results: Analysis...
- `_validate_analysis_results(self, results)`
  - Validate analysis results structure and required fields.

Args:
    results: Analysis results to...
- `get_last_output(self)`
  - Retrieve the last generated workflow action.

Returns:
    Last workflow action package or None
- `get_error_log(self)`
  - Retrieve error log.

Returns:
    List of error messages
- `clear_error_log(self)`
  - Clear the error log.
- `export_interface_specification(self)`
  - Export complete interface specification for documentation.

Returns:
    Interface specification...

---



#### config.py

Configuration management for P/E Compression Analysis.

This module provides centralized configuration handling.

##### Classes

###### `Config`

Configuration manager for P/E Compression Analysis skill.

**Methods:**

- `get_config(cls)`
  - Get current configuration as dictionary.

Returns:
    Configuration dictionary
- `validate_environment(cls)`
  - Validate environment configuration.

Returns:
    Validation results dictionary

---



#### __init__.py

Utility functions and helpers for P/E Compression Analysis.

This module provides common utilities for environment detection,
Markdown rendering, configuration management, and logging.



#### env_utils.py

Environment detection utilities.

This module provides functions for checking API keys,
cache availability, and overall environment state.


##### Functions

###### `check_api_key(key_name)`

Check if an API key is present in the environment.

Args:
    key_name: Name of the environment variable to check

Returns:
    True if key exists and is non-empty, False otherwise

---

###### `get_environment_state()`

Get current environment state for mode selection.

Returns:
    Dictionary containing environment state information

---

###### `_check_cache_availability()`

Check if cached data is available for offline mode.

Returns:
    True if cache exists and is valid, False otherwise

---

###### `_get_python_version()`

Get Python version string.

Returns:
    Python version (e.g., "3.10.5")

---


#### markdown_renderer.py

Markdown rendering utilities for decision frameworks.

This module provides functions to render analysis results
and decision frameworks in well-formatted Markdown.


##### Functions

###### `render_decision_framework(results)`

Render analysis results as a comprehensive Markdown decision framework.

Args:
    results: Analysis results dictionary containing:
        - mode: Operating mode used
        - symbol: Stock symbol (optional)
        - compression_detected: Boolean
        - compression_percentage: Float
        - analysis: Analysis text
        - recommendations: List of recommendations
        - current_pe: Current P/E ratio (optional)
        - historical_pe: Historical P/E ratio (optional)

Returns:
    Formatted Markdown string with decision framework

---

###### `_render_header(symbol, mode)`

Render decision framework header.

Args:
    symbol: Stock symbol
    mode: Analysis mode used

Returns:
    Markdown formatted header

---

###### `_render_executive_summary(results)`

Render executive summary with key metrics.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted executive summary

---

###### `_render_detailed_analysis(results)`

Render detailed analysis section.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted detailed analysis

---

###### `_render_recommendations(results)`

Render actionable decision recommendations.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted recommendations

---

###### `_render_risk_factors(results)`

Render risk factors and considerations.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted risk factors

---

###### `_render_next_steps(results)`

Render actionable next steps checklist.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted next steps

---

###### `_render_mode_info(results)`

Render information about analysis mode and capabilities.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted mode information

---

###### `_render_footer()`

Render decision framework footer.

Returns:
    Markdown formatted footer

---

###### `render_summary_table(results)`

Render a summary table of key metrics.

Args:
    results: Analysis results dictionary

Returns:
    Markdown formatted table

---


#### detector.py

Keyword detection using spaCy NLP.

This module provides robust keyword detection for triggering
P/E Compression Analysis skill activation.

##### Classes

###### `KeywordDetector`

Detects P/E compression related keywords in user input.

Uses spaCy v3.7 for robust NLP-based keyword detection with
100% accuracy target for activation keywords.

Target keywords:
- 'p/e compression'
- 'comparative pe'
- 'valuation'

**Methods:**

- `__init__(self, use_spacy, model_name)`
  - Initialize the keyword detector.

Args:
    use_spacy: Whether to use spaCy for enhanced...
- `detect(self, text)`
  - Detect if any target keywords are present in the text.

Uses spaCy for enhanced detection when...
- `get_detected_keywords(self, text)`
  - Get list of all detected keywords in text.

Args:
    text: Input text to analyze

Returns:
   ...
- `get_detection_details(self, text)`
  - Get detailed detection information including confidence and spans.

Args:
    text: Input text...
- `_detect_with_spacy(self, text)`
  - Detect keywords using spaCy NLP.

Args:
    text: Input text to analyze

Returns:
    True if...
- `_detect_with_regex(self, text)`
  - Detect keywords using regex patterns (fallback).

Args:
    text: Input text to...
- `_get_keywords_with_spacy(self, text)`
  - Get detected keywords using spaCy.

Args:
    text: Input text to analyze

Returns:
    List of...
- `_get_keywords_with_regex(self, text)`
  - Get detected keywords using regex (fallback).

Args:
    text: Input text to analyze

Returns:
 ...

---



#### __init__.py

NLP-based keyword detection using spaCy.

This module provides robust keyword detection for activation of the
P/E Compression Analysis skill.




---

## Usage

### Installation

```bash
pip install -e .
```

### Basic Usage

```python
from src.core.analyzer import PECompressionAnalyzer
```

### Workflow Integration

```python
from src.integration.workflow9_connector import Workflow9Connector
```

---

## Testing

- **Framework**: pytest
- **Coverage Target**: >=85%
- **Test Count**: 140
- **Pass Rate**: 100%

### Performance Targets

- **Keyword Detection**: <0.01s
- **Mode Selection**: <0.1s
- **Full Analysis**: <2s

---

## Documentation

- **Readme**: [README.md](README.md)
- **Api Reference**: [docs/API.md](docs/API.md)
- **Examples**: [examples/](examples/)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT


## Repository

https://github.com/momentum-squared/pe-compression-analysis

---

*Documentation generated automatically from code and configuration.*

## Additional Section

Manually added content for testing drift detection.

