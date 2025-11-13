# Podcast Learning Extraction System - Implementation Plan

## 🎯 Overview
Created: 2025-11-10
Status: Planning → MVP Development

## 📋 TaskMaster Integration
- **Main Task:** #81 - Develop MVP Podcast Learning Extraction System
- **Priority:** High
- **Dependencies:** Tasks 21, 23, 37 (Global orchestration infrastructure)
- **Subtasks:** 8 detailed implementation steps

## 🎬 Proof of Concept Target
**Episode 1: Design Systems and Burnout with Sara Wachter-Boettcher**
- From: Systems of Harm podcast by Amy Hupe
- Focus: Extracting actionable design systems insights
- Output: Structured markdown with references and context-specific actions

## 📂 Project Structure
```
Orchestrator_Project/
├── Docs/
│   └── Podcast_Learning_Extraction_PRD.md ✅ Created
├── lib/
│   └── podcast-learning/
│       ├── input-handler.js          (Subtask 81.1)
│       ├── insight-extractor.js      (Subtask 81.2)
│       ├── reference-parser.js       (Subtask 81.3)
│       ├── reference-categorizer.js  (Subtask 81.4)
│       ├── action-generator.js       (Subtask 81.5)
│       ├── markdown-builder.js       (Subtask 81.6)
│       └── index.js                  (Subtask 81.7)
├── examples/
│   └── podcast-learning-integration.mjs
└── outputs/
    └── podcast-learning/
        ├── episodes/
        ├── references/
        └── actions/
```

## 🔧 Implementation Sequence

### Phase 1: MVP Proof of Concept (Current)
**Goal:** Process Episode 1 manually, validate all components

#### Subtask 81.1: Manual Input Interface ⏳ Next
- CLI interface for transcript and show notes
- Input validation (markdown, required fields)
- Error handling and user feedback

#### Subtask 81.2: Claude API Integration
- Insight extraction (5-10 key points)
- Prompt engineering for quality
- Response logging and error handling

#### Subtask 81.3: Reference Link Parser
- Extract all URLs from show notes
- Validate URL format
- Check HTTP reachability (200 status)

#### Subtask 81.4: Reference Categorizer
- Rule-based classification (books, blogs, courses, tools)
- Claude API fallback for ambiguous cases
- Metadata storage

#### Subtask 81.5: Action Item Generator
- Context-aware prompts (Personal, Work, Business)
- Minimum one item per context
- Clear separation in output

#### Subtask 81.6: Markdown Output Builder
- Assemble all components
- Match PRD template structure
- Validation against template

#### Subtask 81.7: Modular Architecture
- Component separation
- Dependency injection
- Interface boundaries for future automation

#### Subtask 81.8: Documentation
- Setup instructions
- Input/output format specs
- DIET103 integration guide

### Phase 2: Automation (After MVP validation)
- RSS feed parser
- Automatic transcription (AssemblyAI/Whisper)
- Multi-episode batch processing
- Episode tracking database

### Phase 3: Intelligence (After Phase 2)
- Theme detection across episodes
- Personalized recommendations
- Action item progress tracking
- Searchable knowledge base

## 🎯 Success Metrics

### MVP
- [ ] Processes Episode 1 transcript successfully
- [ ] Extracts 5-10 relevant insights
- [ ] Validates all reference links
- [ ] Categorizes references correctly
- [ ] Generates actions for all 3 contexts
- [ ] Outputs markdown matching template
- [ ] Processing time < 2 minutes

### Quality Gates
- [ ] All subtasks have passing tests
- [ ] Code follows modular design principles
- [ ] Documentation is complete and clear
- [ ] DIET103 compliance validated
- [ ] Ready for scenario integration

## 🔗 Dependencies
- Claude API (Anthropic) - Already configured
- Node.js packages:
  - `@anthropic-ai/sdk` - Claude integration
  - `marked` - Markdown parsing
  - `axios` - HTTP requests
  - `commander` - CLI framework
  - `chalk` - Terminal styling

## 📊 Test Episode Data
**Source:** https://podcasts.apple.com/gb/podcast/systems-of-harm/id1687682423

**Known References from Episode 1:**
- Active Voice HQ (https://www.activevoicehq.com/)
- Sara on LinkedIn
- Design for Real Life (book)
- Technically Wrong (book)
- Content Everywhere (book)

**Expected Insights:**
- Burnout vulnerability in design systems teams
- Importance of living your values
- Knowing when to quit
- Sustainable team practices
- Ethical design principles

**Expected Action Items:**
- Personal: Assess burnout risk, define boundaries
- Work: Advocate for sustainable practices, implement stress cases
- Business: Design with user mental load in mind, create ethical checklist

## 🚀 Next Steps
1. Create lib/podcast-learning directory structure
2. Implement CLI input handler (Subtask 81.1)
3. Test with sample transcript data
4. Integrate Claude API for insight extraction
5. Build reference parser and validator
6. Complete all 8 subtasks sequentially
7. Run full end-to-end test with Episode 1
8. Document and prepare for Phase 2

## 📝 Notes
- Start simple: manual input, basic validation
- Focus on quality over speed for MVP
- Design for extensibility from day one
- Document assumptions and decisions
- Keep TaskMaster updated with progress

## 🔄 Status Updates
Track progress in TaskMaster:
```bash
# Check current task
task-master show 81

# Update subtask status
task-master set-status --id=81.1 --status=in-progress
task-master set-status --id=81.1 --status=done

# Add implementation notes
task-master update-subtask --id=81.1 --prompt="Implementation details..."
```

---

**Related Documents:**
- [PRD](./Docs/Podcast_Learning_Extraction_PRD.md)
- [TaskMaster Integration](./Docs/TaskMaster_Integration_Workflow.md)
- [DIET103 Compliance](./Docs/DIET103_COMPLIANCE_COMPLETE.md)

