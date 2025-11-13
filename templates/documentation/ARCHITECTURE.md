# [Component/Feature Name] Architecture

**Version:** 1.0.0  
**Date:** YYYY-MM-DD  
**Status:** [Draft | Active | Deprecated]

---

## Overview

Brief 2-3 sentence description of what this component/feature does and why it exists.

**Key Capabilities:**
- Capability 1
- Capability 2
- Capability 3

---

## Architecture Principles

What design principles guide this architecture? (e.g., "Skills-as-Containers", "Progressive Disclosure", "Token Efficiency")

1. **Principle 1**: Explanation
2. **Principle 2**: Explanation
3. **Principle 3**: Explanation

---

## System Context

Where does this fit in the larger system?

```
┌─────────────────────────────────────┐
│  Higher-Level System                │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  THIS COMPONENT      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Lower-Level Systems │
    └──────────────────────┘
```

**Dependencies:**
- Upstream: What depends on this?
- Downstream: What does this depend on?

---

## Component Architecture

### High-Level Design

```
┌────────────────────────────────────────┐
│          Component Name                │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────┐      ┌──────────┐      │
│  │ Module A │─────▶│ Module B │      │
│  └──────────┘      └──────────┘      │
│                                        │
│  ┌──────────┐      ┌──────────┐      │
│  │ Module C │─────▶│ Module D │      │
│  └──────────┘      └──────────┘      │
│                                        │
└────────────────────────────────────────┘
```

### Modules

#### Module A: [Name]
**Purpose:** What does this module do?

**Responsibilities:**
- Responsibility 1
- Responsibility 2

**Interface:**
```javascript
// Public API
export function primaryFunction(params) { }
export function helperFunction(params) { }
```

**Dependencies:**
- Module X
- External library Y

---

#### Module B: [Name]
**Purpose:** What does this module do?

**Responsibilities:**
- Responsibility 1
- Responsibility 2

**Interface:**
```javascript
// Public API
export function primaryFunction(params) { }
```

**Dependencies:**
- Module Z

---

## Data Flow

How does data move through the system?

```
Input → Validation → Processing → Transformation → Output
  │         │            │              │            │
  ▼         ▼            ▼              ▼            ▼
[Detail] [Detail]    [Detail]       [Detail]     [Detail]
```

**Step-by-Step:**

1. **Input Reception**
   - Format: JSON/YAML/etc
   - Validation: What checks are performed?
   - Example: `{ ... }`

2. **Processing**
   - Algorithm: Describe key algorithms
   - Transformations: What changes to data?

3. **Output Generation**
   - Format: JSON/YAML/etc
   - Validation: What guarantees are provided?
   - Example: `{ ... }`

---

## Key Design Decisions

### Decision 1: [Decision Name]

**Context:** What problem were we solving?

**Options Considered:**
- Option A: Pros/Cons
- Option B: Pros/Cons
- Option C: Pros/Cons

**Decision:** We chose Option B

**Rationale:**
- Reason 1
- Reason 2
- Reason 3

**Trade-offs:**
- ✅ Benefit 1
- ✅ Benefit 2
- ⚠️ Limitation 1

---

### Decision 2: [Decision Name]

**Context:** What problem were we solving?

**Decision:** Summary of decision

**Rationale:** Why this approach?

---

## Extension Points

How can this component be extended or customized?

### Extension Point 1: [Name]

**Purpose:** What can be extended?

**How to Extend:**
```javascript
// Example extension
export class CustomExtension extends BaseClass {
  // Implementation
}
```

**Use Cases:**
- Use case 1
- Use case 2

---

## Performance Considerations

### Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Operation 1 | O(n) | O(1) |
| Operation 2 | O(log n) | O(n) |

### Scalability

- **Current Limits:** What are the practical limits?
- **Bottlenecks:** Where will it slow down first?
- **Optimization Opportunities:** How could it be improved?

---

## Security Considerations

- **Authentication:** How is access controlled?
- **Data Validation:** What input validation is performed?
- **Error Handling:** Are errors exposed safely?
- **Dependencies:** Are external dependencies trusted?

---

## Error Handling

| Error Type | Handling Strategy | Recovery |
|------------|------------------|----------|
| Validation Error | Reject input, return error | User corrects input |
| Network Error | Retry 3x, then fail | Graceful degradation |
| System Error | Log and alert | Manual intervention |

---

## Testing Strategy

### Unit Tests
- Module A: `tests/module-a.test.js`
- Module B: `tests/module-b.test.js`

### Integration Tests
- End-to-end flow: `tests/integration/flow.test.js`

### Test Coverage Goals
- Target: 80% code coverage
- Critical paths: 100% coverage

---

## Deployment & Configuration

### Configuration Options

```javascript
{
  "option1": "default value",
  "option2": 100,
  "option3": true
}
```

### Environment Variables

- `ENV_VAR_1`: Description (required)
- `ENV_VAR_2`: Description (optional, default: X)

---

## Monitoring & Observability

**Key Metrics:**
- Metric 1: What it measures, why it matters
- Metric 2: What it measures, why it matters

**Logging:**
- What is logged?
- Log levels used?
- Where are logs stored?

---

## Future Enhancements

### Planned (Short-term)
- Enhancement 1: Brief description
- Enhancement 2: Brief description

### Considered (Long-term)
- Enhancement 3: Brief description
- Enhancement 4: Brief description

### Explicitly Not Planned (YAGNI)
- Feature X: Why we're not building it
- Feature Y: Why we're not building it

---

## References

- Related documentation: `link-to-doc.md`
- External resources: https://example.com
- ADRs: `Docs/decisions/ADR-001.md`

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | YYYY-MM-DD | Initial architecture | Name |

---

*This document should be updated when significant architectural changes occur.*

