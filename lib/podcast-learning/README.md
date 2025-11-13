# Podcast Learning Extraction System

Transform podcast episodes into actionable insights with AI-powered extraction, categorization, and personalized recommendations.

## Overview

This system processes podcast episodes (transcript + show notes) and generates:
- **Key Insights**: AI-extracted learnings from the episode
- **Categorized References**: Books, courses, blogs, tools mentioned in the episode
- **Action Items**: Context-specific recommendations tailored to your goals
- **Beautiful Reports**: Markdown documents ready for your knowledge base

## Quick Start

### 1. Installation

```bash
cd lib/podcast-learning
npm install
```

### 2. Set Up API Key

Create a `.env` file in the project root:

```bash
# Required for insight extraction and action generation
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Note**: You can get an Anthropic API key from https://console.anthropic.com

### 3. Process Your First Episode

```bash
# Using test mode (no API key required)
npm run cli process \
  -t test-data/sample-transcript.txt \
  -s test-data/sample-show-notes.md \
  --title "Episode Title" \
  --guest "Guest Name" \
  --episode 1 \
  --test

# Using real API (requires ANTHROPIC_API_KEY)
npm run cli process \
  -t path/to/transcript.txt \
  -s path/to/show-notes.md \
  --title "Episode Title" \
  --guest "Guest Name" \
  --episode 1
```

### 4. View Your Results

Results are saved to:
- **JSON**: `../../outputs/podcast-learning/processed/episode-{num}-{guest}.json`
- **Markdown**: `../../outputs/podcast-learning/episodes/episode-{num}-{guest}.md`

## Features

### 🧠 Intelligent Insight Extraction
Extracts 5-10 key learnings from episode transcripts using Claude AI.

### 🔗 Reference Discovery & Validation
- Extracts all URLs from show notes
- Validates link reachability
- Categorizes by type (books 📚, courses 🎓, blogs 📝, etc.)

### 🎯 Context-Aware Action Generation
Generates personalized action items for your specific contexts:
- Personal Practice
- Regular Work
- Landing Page Business (or customize your own)

### 📝 Beautiful Markdown Reports
Professional-looking reports with:
- Numbered insights
- Categorized references with status indicators
- Actionable checkboxes for implementation tracking
- Full processing metadata

## Usage

### Command-Line Interface

```bash
# Interactive mode (asks for inputs)
npm run cli input

# Process from files
npm run cli process \
  -t transcript.txt \
  -s show-notes.md \
  --title "Episode Title" \
  --guest "Guest Name" \
  --episode 1

# Validate inputs without processing
npm run cli validate \
  -t transcript.txt \
  -s show-notes.md \
  --title "Episode Title" \
  --guest "Guest Name" \
  --episode 1

# Input from files without processing
npm run cli input-from-files \
  -t transcript.txt \
  -s show-notes.md \
  --title "Episode Title" \
  --guest "Guest Name" \
  --episode 1
```

### Programmatic Usage

```javascript
import { processEpisode } from './podcast-learning/index.js';

const result = await processEpisode({
  transcript: 'Episode transcript...',
  showNotes: '# Show notes markdown...',
  metadata: {
    title: 'Episode Title',
    guest: 'Guest Name',
    episodeNumber: 1,
    date: '2025-01-01',
    duration: '45:30'
  },
  contexts: [
    {
      name: 'Personal Practice',
      description: 'Applying learnings to personal projects',
      goals: ['Improve skills', 'Build better projects']
    }
  ]
}, {
  testMode: false,  // Set to true for testing without API
  verbose: true
});

console.log(result.insights);
console.log(result.markdownPath);
```

## Input Format

### Transcript File (`.txt`)
Plain text transcript of the podcast episode:

```
Sara: Design systems teams face unique challenges...
Host: Can you elaborate on that?
Sara: Sure, the constant context switching...
```

### Show Notes File (`.md`)
Markdown-formatted show notes with links:

```markdown
# Episode 1: Design Systems and Burnout

## Guest
Sara Wachter-Boettcher

## Links
- [Design for Real Life](https://abookapart.com/products/design-for-real-life)
- [Technically Wrong](https://bookshop.org/books/technically-wrong)
- [Sara's Website](https://www.sarawb.com)
```

## Output Format

### JSON Output
Structured data with all processed information:

```json
{
  "episode": {
    "title": "...",
    "guest": "...",
    "episodeNumber": 1
  },
  "insights": [
    "Key insight 1...",
    "Key insight 2..."
  ],
  "references": [
    {
      "url": "https://...",
      "category": "book",
      "reachable": true,
      "title": "..."
    }
  ],
  "actions": [
    {
      "name": "Personal Practice",
      "actions": [
        {
          "title": "Action title",
          "description": "Detailed description",
          "effort": "low",
          "impact": "high",
          "timeframe": "immediate"
        }
      ]
    }
  ]
}
```

### Markdown Output
Beautiful, human-readable report following the PRD template.

See [sample output](../../outputs/podcast-learning/episodes/episode-01-sara-wachter-boettcher.md) for an example.

## Configuration

### Default Contexts
Edit `input-handler.js` to customize your default contexts:

```javascript
export function getDefaultContexts() {
  return [
    {
      name: 'Your Context',
      description: 'Description of how you'll apply learnings',
      goals: ['Goal 1', 'Goal 2']
    }
  ];
}
```

### Processing Options
All processing functions accept an options object:

```javascript
{
  validateFirst: true,          // Validate inputs before processing
  saveOutput: true,              // Save JSON and markdown outputs
  verbose: true,                 // Show detailed progress
  testMode: false,               // Use test data (no API calls)
  validateReferences: true,      // Check URL reachability
  categorizeReferences: true,    // Categorize references
  generateActionItems: true,     // Generate action items
  generateMarkdownReport: true   // Create markdown report
}
```

## Test Mode

Test mode allows you to run the system without an API key:

```bash
npm run cli process -t test-data/sample-transcript.txt -s test-data/sample-show-notes.md --test
```

Test mode uses pre-generated data:
- `test-insights.json` - 8 sample insights
- `test-actions.json` - 11 sample actions across 3 contexts

Perfect for:
- Development and testing
- CI/CD pipelines
- Demonstration purposes
- Learning how the system works

## Architecture

The system is built with a modular architecture:

```
input-handler → insight-extractor → reference-parser → 
  → reference-categorizer → action-generator → 
  → markdown-generator
```

Each module is independently testable and can be used standalone.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## Development

### Run Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

### Project Structure

```
podcast-learning/
├── cli.js                    # Command-line interface
├── process.js                # Main pipeline orchestrator
├── input-handler.js          # Input validation
├── insight-extractor.js      # AI insight extraction
├── reference-parser.js       # URL validation
├── reference-categorizer.js  # Reference categorization
├── action-generator.js       # Action item generation
├── markdown-generator.js     # Report generation
├── config.js                 # Configuration management
├── index.js                  # Main exports
│
├── test-data/               # Sample episode data
├── __tests__/               # Unit tests
│
├── README.md                # This file
├── ARCHITECTURE.md          # Architecture documentation
└── MODULE_STRUCTURE.md      # Module dependency guide
```

## Troubleshooting

### API Key Issues

**Error**: `ANTHROPIC_API_KEY environment variable is not set`

**Solution**: Create a `.env` file with your API key or use `--test` mode:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > ../../.env
```

### Reference Validation Failures

**Issue**: Some references show as unreachable (⚠️)

**Explanation**: This is normal. Some URLs may:
- Require authentication
- Block automated requests
- Be temporarily down
- Have invalid formatting (e.g., extra closing parentheses)

The system validates but doesn't fail on broken links.

### Test Mode Not Working

**Error**: `Failed to load test insights`

**Solution**: Ensure test data files exist:
- `test-insights.json`
- `test-actions.json`
- `test-data/sample-transcript.txt`
- `test-data/sample-show-notes.md`

### Out of Memory

**Issue**: Processing very long episodes causes memory issues

**Solution**: 
- Break transcript into smaller chunks
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run cli process ...`

## Roadmap

### Planned Features
- [ ] Quote extraction from transcripts
- [ ] Theme detection across episodes
- [ ] Related episode linking
- [ ] Multiple export formats (PDF, Notion, Obsidian)
- [ ] Web interface
- [ ] Batch processing for multiple episodes
- [ ] Progress tracking for action completion

### Future Enhancements
- Plugin system for custom processing steps
- Caching layer for improved performance
- Streaming for long transcripts
- REST API for remote processing

## Contributing

This is currently an MVP proof-of-concept. Contributions welcome!

Areas for improvement:
- Additional reference categories
- More robust URL extraction
- Alternative AI providers
- Performance optimizations

## License

ISC

## Support

For issues or questions:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
2. Review test files in `__tests__/` for usage examples
3. Run with `--test` mode to verify setup

## Credits

Built as part of the Orchestrator Project using:
- Claude AI (Anthropic) for insight extraction
- Node.js ecosystem for processing
- Taskmaster for project management

---

**Ready to transform your podcast learning? Start with the Quick Start guide above!** 🎙️
