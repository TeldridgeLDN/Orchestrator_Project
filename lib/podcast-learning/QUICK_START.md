# Quick Start Guide

Get up and running with the Podcast Learning Extraction System in 5 minutes!

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Anthropic API key (for production use)

## Step 1: Installation (1 minute)

```bash
# Navigate to the project
cd lib/podcast-learning

# Install dependencies
npm install
```

**Output**: You should see npm install packages successfully.

## Step 2: Try Test Mode (1 minute)

Test the system without an API key using pre-generated data:

```bash
npm run cli process \
  -t test-data/sample-transcript.txt \
  -s test-data/sample-show-notes.md \
  --title "Design Systems and Burnout" \
  --guest "Sara Wachter-Boettcher" \
  --episode 1 \
  --test
```

**Output**: You should see:
- ✅ Processing complete!
- Results saved to `../../outputs/podcast-learning/`

**View results**:
```bash
# View markdown report
cat ../../outputs/podcast-learning/episodes/episode-01-sara-wachter-boettcher.md

# View JSON data
cat ../../outputs/podcast-learning/processed/episode-01-sara-wachter-boettcher.json | jq '.'
```

## Step 3: Set Up API Key (1 minute)

Create a `.env` file in the project root (`Orchestrator_Project/`):

```bash
# From lib/podcast-learning directory
echo "ANTHROPIC_API_KEY=your-key-here" > ../../.env
```

**Get your API key**:
1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into `.env` file

## Step 4: Process Your First Real Episode (2 minutes)

### Prepare your files:

**transcript.txt**:
```
[Speaker 1]: Welcome to the show...
[Speaker 2]: Thanks for having me...
```

**show-notes.md**:
```markdown
# Episode Title

## Guest
Guest Name

## Links
- [Link 1](https://example.com)
- [Link 2](https://example.org)
```

### Run processing:

```bash
npm run cli process \
  -t path/to/transcript.txt \
  -s path/to/show-notes.md \
  --title "Your Episode Title" \
  --guest "Guest Name" \
  --episode 1
```

**Output**: You should see:
1. Step 1/7: Validating input data...
2. Step 2/7: Extracting insights...
3. ... (through Step 7)
4. ✅ Processing complete!

## What You Get

### 1. JSON Output
`outputs/podcast-learning/processed/episode-{num}-{guest}.json`

Contains:
- Key insights array
- Categorized references
- Action items by context
- Processing metadata

### 2. Markdown Report  
`outputs/podcast-learning/episodes/episode-{num}-{guest}.md`

Beautiful report with:
- Episode header
- Numbered insights
- Categorized references (📚📝🎓)
- Action items as checkboxes

### 3. Processing Logs
`outputs/podcast-learning/logs/`

Contains:
- API call details
- Error logs
- Timing information

## Common Use Cases

### Use Case 1: Weekly Podcast Learning
```bash
# Create a batch script
for episode in episodes/*.txt; do
  npm run cli process \
    -t "$episode" \
    -s "show-notes/$(basename $episode .txt).md" \
    --title "Episode $(basename $episode .txt)" \
    --guest "Guest Name" \
    --episode "$((i++))"
done
```

### Use Case 2: Research Mode
```bash
# Save outputs without markdown
npm run cli process \
  -t transcript.txt \
  -s show-notes.md \
  --title "Research Episode" \
  --guest "Expert" \
  --episode 1 \
  --no-save
```

### Use Case 3: Validation Only
```bash
# Check inputs without processing
npm run cli validate \
  -t transcript.txt \
  -s show-notes.md \
  --title "Episode" \
  --guest "Guest" \
  --episode 1
```

## Troubleshooting

### "API key not found"
**Problem**: Missing or incorrect API key

**Solution**:
```bash
# Check .env file exists
ls ../../.env

# Verify format
cat ../../.env
# Should show: ANTHROPIC_API_KEY=sk-ant-...
```

### "Module not found"
**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

### "Invalid URL format"
**Problem**: Show notes have malformed URLs

**Solution**: 
- Check for extra closing parentheses
- Ensure URLs are properly formatted
- Use markdown link format: `[text](url)`

### "Out of tokens"
**Problem**: API rate limit or quota exceeded

**Solution**:
- Use `--test` mode for development
- Check your Anthropic console for usage
- Wait and retry if rate limited

## Next Steps

### Learn More
- Read [README.md](./README.md) for complete documentation
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [DIET103_INTEGRATION.md](./DIET103_INTEGRATION.md) for orchestration

### Customize
- Edit default contexts in `input-handler.js`
- Adjust API parameters in `config.js`
- Create custom reference categories in `reference-categorizer.js`

### Integrate
- Use programmatic API (see README.md)
- Build automated workflows
- Connect to knowledge management systems

### Contribute
- Add new processing modules
- Improve categorization rules
- Enhance action generation prompts

## Quick Reference

### CLI Commands
```bash
# Interactive input
npm run cli input

# File-based processing
npm run cli process -t TRANS -s NOTES --title T --guest G --episode N

# Validation only
npm run cli validate -t TRANS -s NOTES --title T --guest G --episode N

# Test mode (no API)
npm run cli process -t TRANS -s NOTES --title T --guest G --episode N --test

# Quiet mode (minimal output)
npm run cli process ... --quiet
```

### File Paths
```
Inputs:
  - Transcripts: anywhere accessible
  - Show notes: anywhere accessible

Outputs:
  - JSON: outputs/podcast-learning/processed/
  - Markdown: outputs/podcast-learning/episodes/
  - Logs: outputs/podcast-learning/logs/
```

### Environment Variables
```bash
# Required for production
ANTHROPIC_API_KEY=sk-ant-...

# Optional (future features)
PERPLEXITY_API_KEY=...
OPENAI_API_KEY=...
```

## Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Test mode works (`--test` flag)
- [ ] API key configured (`.env` file)
- [ ] First episode processed successfully
- [ ] Output files generated (JSON + Markdown)
- [ ] Results reviewed and validated

## Help & Support

**Getting stuck?**
1. Try test mode: `--test`
2. Check logs: `outputs/podcast-learning/logs/`
3. Review error messages carefully
4. Verify file paths and formats
5. Check API key is valid

**Still need help?**
- Review full documentation in README.md
- Check test files for examples
- Verify prerequisites are met

---

**You're ready to transform podcast content into actionable insights!** 🎙️✨

