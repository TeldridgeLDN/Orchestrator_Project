# Dashboard Components

React components for the Orchestrator Dashboard.

## ActiveSkillsPanel

Displays active skills in a clean, professional table format.

### Features

- ✅ Clean table layout with headers
- ✅ Loading state with animated spinner
- ✅ Empty state with helpful icon and message
- ✅ Hover effects on table rows
- ✅ Responsive design
- ✅ Status badges (active/inactive)
- ✅ Code-formatted file paths
- ✅ Optional skill descriptions

### Props

```typescript
interface ActiveSkillsPanelProps {
  /** Array of skills to display */
  skills: Skill[] | null;
  /** Loading state indicator */
  loading?: boolean;
}
```

### Skill Data Structure

```typescript
interface Skill {
  name: string;
  status: 'active' | 'inactive';
  path: string;
  description?: string;
}
```

### Usage

#### Basic Usage

```tsx
import { ActiveSkillsPanel } from './components/ActiveSkillsPanel';
import { Skill } from './types';

function Dashboard() {
  const skills: Skill[] = [
    {
      name: 'scenario_builder',
      status: 'active',
      path: '~/.claude/skills/scenario_builder'
    }
  ];

  return <ActiveSkillsPanel skills={skills} />;
}
```

#### With Loading State

```tsx
function Dashboard() {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills().then(data => {
      setSkills(data);
      setLoading(false);
    });
  }, []);

  return <ActiveSkillsPanel skills={skills} loading={loading} />;
}
```

#### Handling Empty State

```tsx
// When skills is null or empty array, shows helpful empty state
<ActiveSkillsPanel skills={[]} />  // Empty state
<ActiveSkillsPanel skills={null} />  // Empty state
```

### Styling

The component uses Tailwind CSS classes for styling:

- **Panel Container**: White background, rounded corners, shadow
- **Header**: Gray border, padding, skill count
- **Table**: Hover effects, striped rows, responsive
- **Status Badges**: 
  - `active`: Green background
  - `inactive`: Gray background
- **Loading**: Animated blue spinner
- **Empty State**: Centered icon and text

### States

#### 1. Loading State
Shows animated spinner with "Loading skills..." message

#### 2. Empty State
Shows icon with:
- "No active skills found" message
- Helpful subtitle about layer selection

#### 3. Data State
Shows table with:
- Skill name (with optional description)
- Status badge
- File path in monospace font

### Accessibility

- Semantic HTML (`table`, `thead`, `tbody`, `th`, `td`)
- Proper table headers with `scope="col"`
- ARIA-compliant loading indicators
- Keyboard-accessible

### Performance

- Efficient rendering with React keys
- Conditional rendering for states
- No unnecessary re-renders
- Optimized Tailwind classes

### Examples

#### Skill with Description

```typescript
{
  name: 'scenario_builder',
  status: 'active',
  path: '~/.claude/skills/scenario_builder',
  description: 'Manages scenario lifecycle and deployment'
}
```

#### Multiple Skills

```typescript
const skills: Skill[] = [
  {
    name: 'project_orchestrator',
    status: 'active',
    path: '~/.claude/skills/project_orchestrator'
  },
  {
    name: 'scenario_builder',
    status: 'active',
    path: '~/.claude/skills/scenario_builder'
  },
  {
    name: 'deprecated_skill',
    status: 'inactive',
    path: '~/.claude/skills/deprecated'
  }
];

<ActiveSkillsPanel skills={skills} />
```

### Testing

```bash
# Run component tests
npm test ActiveSkillsPanel

# Test cases to verify:
# - Renders loading state
# - Renders empty state
# - Renders table with skills
# - Handles status badges correctly
# - Shows skill descriptions when present
# - Handles null/undefined skills array
```

### File Location

```
dashboard/src/components/ActiveSkillsPanel.tsx
```

### Dependencies

- React 19+
- TypeScript
- Tailwind CSS
- Types from `../types.ts`

---

## Future Components

### Planned Components
- `HookLogsPanel` - Display hook execution logs
- `ConfigPanel` - Show configuration settings
- `FileManifestPanel` - Display file manifest statistics

### Component Guidelines
- Keep components focused and single-purpose
- Use TypeScript for type safety
- Include loading and empty states
- Follow Tailwind CSS patterns
- Document props and usage
- Write tests for all states

