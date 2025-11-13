# Podcast Learning Extraction System - Product Requirements Document

## Overview
A system for ingesting podcast episodes with transcripts, extracting key insights, validating references, and generating context-specific action items for personal and professional application.

## Target Podcast Example
**Systems of Harm** by Amy Hupe
- URL: https://podcasts.apple.com/gb/podcast/systems-of-harm/id1687682423
- Focus: Design systems, accessibility, inclusive design, systems thinking
- Format: ~50min episodes with guest interviews
- Show notes include rich reference links

## Goals

### Primary
1. Extract actionable insights from podcast episodes
2. Validate and categorize all referenced resources
3. Map learnings to specific application contexts
4. Create a searchable knowledge base

### User Contexts
1. **Personal Practice** - Individual skill development, frameworks, self-care
2. **Regular Work** - Team practices, advocacy, implementation
3. **Landing Page Business** - Client deliverables, reusable patterns, efficiency

## User Stories

### MVP (Phase 1)
- As a user, I can provide a podcast episode transcript and get a structured summary
- As a user, I can see all referenced links categorized by type (book, blog, course, etc.)
- As a user, I can see action items organized by my three contexts
- As a user, I can validate that links are still active

### Phase 2 (Automation)
- As a user, I can provide an RSS feed URL and process all episodes
- As a user, I can automatically generate transcripts from audio
- As a user, I can track which episodes I've processed

### Phase 3 (Intelligence)
- As a user, I can see themes across multiple episodes
- As a user, I can get personalized recommendations based on my interests
- As a user, I can track progress on action items

## Technical Requirements

### Input
- Episode metadata (title, guest, date, duration)
- Full transcript (text)
- Show notes with links
- Knowledge domains of interest
- User's application contexts

### Processing
1. **Summarization**
   - Extract key points (5-10 per episode)
   - Identify main themes
   - Capture guest expertise areas

2. **Reference Extraction**
   - Parse all URLs from transcript and show notes
   - Fetch metadata for each link
   - Categorize by type (book, blog, podcast, course, video, tool)
   - Validate link status (active, broken, redirect)

3. **Knowledge Synthesis**
   - Map insights to user contexts
   - Generate actionable items per context
   - Cross-reference with existing learnings

### Output Structure

```
outputs/
  episodes/
    episode-01-sara-wachter-boettcher.md
    episode-02-brad-frost.md
  references/
    reference-library.json
    books.md
    blogs.md
    courses.md
  actions/
    personal-practice.md
    regular-work.md
    landing-page-business.md
  consolidated-learning-report.md
```

### Output Format: Episode Summary

```markdown
# Episode [Number]: [Title] with [Guest Name]

**Date:** [Date]
**Duration:** [Duration]
**Guest Expertise:** [Areas]

## Key Insights
1. [Major insight with brief explanation]
2. [Major insight with brief explanation]
...

## Themes
- [Theme 1]
- [Theme 2]

## Referenced Resources

### Books
- ✅ [Title](url) by Author - [Brief description]

### Courses
- ✅ [Title](url) - [Brief description]

### Blogs/Articles
- ✅ [Title](url) - [Brief description]

### Tools/Services
- ✅ [Name](url) - [Brief description]

## Action Items by Context

### Personal Practice
- [ ] [Specific action derived from insight]
- [ ] [Specific action derived from insight]

### Regular Work
- [ ] [Specific action derived from insight]
- [ ] [Specific action derived from insight]

### Landing Page Business
- [ ] [Specific action derived from insight]
- [ ] [Specific action derived from insight]

## Quotes
> "[Notable quote from episode]" - [Speaker]

## Related Episodes
- [Link to related episode if applicable]
```

## Test Episode for MVP
**Episode 1: Design Systems and Burnout with Sara Wachter-Boettcher**

Source transcript and show notes available from:
https://podcasts.apple.com/gb/podcast/design-systems-and-burnout-with-sara-wachter-boettcher/id1687682423?i=1000678379542

## Success Criteria

### MVP
- [ ] Can process one episode transcript manually
- [ ] Extracts 5-10 key insights accurately
- [ ] Identifies and categorizes all references from show notes
- [ ] Validates link status (active/broken)
- [ ] Generates action items for all three contexts
- [ ] Produces markdown output matching template
- [ ] Processing time < 2 minutes per episode

### Phase 2
- [ ] Can parse RSS feed automatically
- [ ] Generates transcripts from audio files
- [ ] Processes entire podcast series
- [ ] Maintains processed episode history

### Phase 3
- [ ] Identifies themes across episodes
- [ ] Provides personalized recommendations
- [ ] Tracks action item completion
- [ ] Enables search across knowledge base

## Technology Stack

### MVP
- Node.js for orchestration
- Claude API for summarization and insight extraction
- Cheerio/Playwright for link validation
- Markdown for output format
- JSON for reference library

### Phase 2
- AssemblyAI or Whisper for transcription
- RSS parser (node-podcast-parser)
- SQLite for episode tracking

### Phase 3
- Vector database for semantic search
- LangChain for theme detection
- Web interface for progress tracking

## Integration with Orchestrator Project
- Implements as DIET103-compliant scenario
- Uses existing MCP tools where possible
- Follows scenario validation patterns
- Integrates with TaskMaster for tracking

## Timeline
- **MVP:** 2-3 days
- **Phase 2:** 1 week after MVP validation
- **Phase 3:** 1-2 weeks after Phase 2 validation

## Dependencies
- Claude API access (already available)
- Podcast transcripts (manual for MVP, API for Phase 2)
- Show notes access (web scraping or manual)

## Risk Mitigation
- **Transcript availability:** Start with manual input, add automation later
- **API costs:** Estimate $0.50-$1.00 per episode for Claude processing
- **Link rot:** Store archived versions of key references
- **Context specificity:** Allow user to customize context definitions

## Future Enhancements
- Browser extension for one-click capture
- Integration with note-taking apps (Notion, Obsidian)
- Spaced repetition for action items
- Collaborative sharing of learning reports
- Multi-podcast aggregation

