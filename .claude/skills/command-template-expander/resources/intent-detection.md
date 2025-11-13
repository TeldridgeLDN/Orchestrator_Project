# Intent Detection Rules

## Overview
This document defines the intent detection patterns and rules used by the Command Template Expander to parse natural language commands.

## Detection Strategy

### 1. Pattern-Based Matching (Primary)
Fast, deterministic regex patterns for common command structures.

### 2. NLP-Based Extraction (Secondary)
Use spaCy or similar for entity extraction when patterns are insufficient.

### 3. LLM Fallback (Tertiary)
For ambiguous or complex queries, fall back to Claude/GPT-4 API.

## Intent Categories

### Portfolio Commands
**Keywords**: score, rate, analyze, evaluate, rebalance, balance, reallocate

**Patterns**:
```regex
(score|rate|analyze|evaluate)\s+(ISA|SIPP|OPP|ALL)?\s*portfolio
rebalance\s+(ISA|SIPP|OPP)\s*(?:portfolio)?\s*(?:with|using)?\s*(momentum|equal|risk-parity|mean-variance)?
```

**Examples**:
- "score ISA portfolio" → `workflow=portfolio, template=score, portfolio=ISA`
- "rebalance SIPP with momentum" → `workflow=portfolio, template=rebalance, portfolio=SIPP, allocation=momentum`

### Backtest Commands
**Keywords**: backtest, test, run, simulate, compare

**Patterns**:
```regex
(?:run\s+)?backtest(?:\s+for)?\s+([A-Z]{1,5})(?:\s+with)?\s+(\d+)\s+month\s+lookback
compare\s+([A-Z,]+)\s+(?:with|using)\s+(.+)\s+strategies
```

**Examples**:
- "run backtest for MSFT with 12 month lookback" → `workflow=backtest, template=run, symbol=MSFT, lookback=12`
- "backtest AAPL from 2021-01-01" → `workflow=backtest, template=run, symbol=AAPL, start_date=2021-01-01`

### Data Commands
**Keywords**: fetch, get, download, pull, validate, check, verify

**Patterns**:
```regex
(?:fetch|get|download|pull)\s+(?:data\s+for\s+)?([A-Z,]+)
validate\s+(ISA|SIPP|OPP|ALL)\s*portfolio(?:\s+data)?
```

**Examples**:
- "fetch data for MSFT,AAPL" → `workflow=data, template=fetch, symbols=MSFT,AAPL`
- "validate ISA portfolio" → `workflow=data, template=validate, portfolio=ISA`

### Report Commands
**Keywords**: generate, report, create, dashboard, dash, launch

**Patterns**:
```regex
generate\s+(summary|detailed|performance|risk)?\s*report\s+for\s+(ISA|SIPP|OPP|ALL)
(?:launch|start)\s+dashboard(?:\s+for\s+(ISA|SIPP|OPP|ALL))?(?:\s+on\s+port\s+(\d+))?
```

**Examples**:
- "generate summary report for ISA" → `workflow=report, template=generate, portfolio=ISA, report_type=summary`
- "launch dashboard on port 8080" → `workflow=report, template=dashboard, port=8080`

## Parameter Extraction

### Symbol Extraction
```regex
[A-Z]{1,5}(?![a-z])  # 1-5 uppercase letters not followed by lowercase
```

**Context**: Must appear after keywords like "for", "symbol", or at command boundaries.

### Portfolio Names
```regex
\b(ISA|SIPP|OPP|ALL)\b
```

**Context**: Case-sensitive, must be word-bounded.

### Dates
```regex
\d{4}-\d{2}-\d{2}  # YYYY-MM-DD format
(?:from|since|start(?:ing)?)\s+(\d{4}-\d{2}-\d{2})
```

### Numeric Parameters
```regex
(\d+)\s+(?:month|mo|m)\s+lookback  # Lookback period
port\s+(\d+)  # Port number
```

### Boolean Flags
**Keywords**: verbose, debug, dry-run, force

**Detection**: Presence of keyword sets flag to true.

## Disambiguation Rules

### Ambiguous Symbol vs. Portfolio
If input contains both a portfolio keyword (ISA/SIPP/OPP) and potential symbols:
- Portfolio keywords take precedence
- Single uppercase word after "for" is likely a symbol
- Multiple comma-separated uppercase words are symbols

**Example**: 
- "score ISA" → portfolio=ISA (not symbol)
- "backtest MSFT" → symbol=MSFT (not portfolio)

### Command vs. Subcommand
Some workflows have nested commands:
- "run backtest" → workflow=backtest, template=run
- "backtest MSFT" → workflow=backtest, template=run (implied)

Use context and template requirements to resolve.

### Optional vs. Required Parameters
If a required parameter is missing after pattern matching:
1. Check for synonyms or alternate phrasing
2. Prompt user interactively
3. If non-interactive, return error with suggestion

## Confidence Scoring

Assign confidence scores to intent matches:
- **High (>0.8)**: Exact pattern match with all required parameters
- **Medium (0.5-0.8)**: Pattern match but missing optional parameters
- **Low (<0.5)**: Partial match or ambiguous intent

Threshold for automatic expansion: **0.7**
Below threshold: Prompt for clarification

## Edge Cases

### Multi-Word Parameters
Some parameters may contain spaces:
```
"mean-variance" vs "mean variance"
```
Normalize by converting spaces to hyphens in strategy names.

### Case Sensitivity
- Portfolio names: Case-insensitive (ISA = isa = Isa)
- Symbols: Case-insensitive but normalized to uppercase
- Commands/workflows: Case-insensitive

### Typos and Variants
Common typos to handle:
- "bactest" → "backtest"
- "retreive" → "retrieve"
- "comparision" → "comparison"

Use fuzzy matching (Levenshtein distance ≤2) for close matches.

## Error Messages

### Missing Required Parameter
```
Error: Missing required parameter 'portfolio' for command 'score'.
Did you mean: "score ISA portfolio"?
```

### Ambiguous Intent
```
Warning: Ambiguous command detected. Did you mean:
  1. score ISA portfolio
  2. backtest ISA (treated as symbol)
Please clarify or use template ID directly.
```

### Invalid Parameter Value
```
Error: Invalid value 'XYZ' for parameter 'portfolio'.
Valid options: ISA, SIPP, OPP, ALL
```

## Testing Intent Detection

### Test Cases
1. **Valid Commands**: Ensure >90% accuracy on known templates
2. **Variants**: Test aliases and rephrased commands
3. **Negative**: Ensure nonsense input is rejected
4. **Partial**: Test handling of incomplete commands
5. **Ambiguous**: Verify disambiguation logic

### Accuracy Metrics
- **Precision**: % of detected intents that are correct
- **Recall**: % of valid commands that are detected
- **F1 Score**: Harmonic mean of precision and recall

**Target**: F1 > 0.90

## Future Enhancements
- Learn from user corrections
- Context-aware parsing (remember previous commands)
- Multi-turn dialogue for parameter gathering
- Custom user-defined aliases
- Voice command support with phonetic matching

## Last Updated
November 13, 2025

