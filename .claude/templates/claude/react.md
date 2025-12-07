# Claude Development Guidelines - React

## Core Principles

**These are non-negotiable. Every change must adhere to these principles.**

1. **Component-driven development** — Build UI from small, reusable, composable components
2. **Unidirectional data flow** — State flows down via props, events flow up via callbacks
3. **Immutability by default** — Never mutate state directly; use immutable update patterns
4. **Separation of concerns** — Separate presentation (UI) from logic (hooks) from data (state)
5. **Type safety first** — Full TypeScript coverage, no `any` types

## Workflow

### Development Cycle: Component-First TDD

1. **Design** — Sketch component API (props interface) before implementation
2. **Test** — Write component tests describing expected behavior
3. **Build** — Implement component to pass tests
4. **Style** — Add styling (CSS modules, Tailwind, styled-components)
5. **Document** — Add Storybook story if applicable

**Quality Gates:**

Before committing:
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No accessibility violations (axe-core)
- [ ] Component renders without console errors
- [ ] No `any` types added

## Code Patterns

### Functional Component Template
```tsx
import { type FC, type ReactNode } from 'react';

interface [ComponentName]Props {
  readonly children?: ReactNode;
  readonly [prop]: [Type];
  readonly on[Event]?: (value: [Type]) => void;
}

export const [ComponentName]: FC<[ComponentName]Props> = ({
  children,
  [prop],
  on[Event],
}) => {
  return (
    <div className="[component-class]">
      {children}
    </div>
  );
};

[ComponentName].displayName = '[ComponentName]';
```

### Custom Hook Template
```tsx
import { useState, useCallback, useMemo } from 'react';

interface Use[HookName]Options {
  readonly [option]: [Type];
}

interface Use[HookName]Return {
  readonly [value]: [Type];
  readonly [action]: () => void;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export function use[HookName](options: Use[HookName]Options): Use[HookName]Return {
  const [state, setState] = useState<[StateType]>([initialValue]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [action] = useCallback(() => {
    // Action implementation
    setState(prev => /* immutable update */);
  }, [/* dependencies */]);

  const [derivedValue] = useMemo(() => {
    return /* computed value */;
  }, [/* dependencies */]);

  return {
    [value]: state,
    [action],
    isLoading,
    error,
  };
}
```

### Context Provider Template
```tsx
import { createContext, useContext, type FC, type ReactNode, useMemo } from 'react';

interface [Context]State {
  readonly [value]: [Type];
}

interface [Context]Actions {
  readonly [action]: (value: [Type]) => void;
}

type [Context]Value = [Context]State & [Context]Actions;

const [Context]Context = createContext<[Context]Value | null>(null);

interface [Context]ProviderProps {
  readonly children: ReactNode;
  readonly initial[Value]?: [Type];
}

export const [Context]Provider: FC<[Context]ProviderProps> = ({
  children,
  initial[Value],
}) => {
  const [state, setState] = useState<[Context]State>({
    [value]: initial[Value] ?? [defaultValue],
  });

  const actions = useMemo<[Context]Actions>(() => ({
    [action]: (value) => {
      setState(prev => ({ ...prev, [field]: value }));
    },
  }), []);

  const value = useMemo<[Context]Value>(
    () => ({ ...state, ...actions }),
    [state, actions]
  );

  return (
    <[Context]Context.Provider value={value}>
      {children}
    </[Context]Context.Provider>
  );
};

export function use[Context](): [Context]Value {
  const context = useContext([Context]Context);
  if (!context) {
    throw new Error('use[Context] must be used within [Context]Provider');
  }
  return context;
}
```

### Data Fetching Hook Template (React Query)
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys factory
export const [entity]Keys = {
  all: ['[entities]'] as const,
  lists: () => [...[entity]Keys.all, 'list'] as const,
  list: (filters: [Filters]) => [...[entity]Keys.lists(), filters] as const,
  details: () => [...[entity]Keys.all, 'detail'] as const,
  detail: (id: string) => [...[entity]Keys.details(), id] as const,
};

// Fetch hook
export function use[Entity](id: string) {
  return useQuery({
    queryKey: [entity]Keys.detail(id),
    queryFn: () => api.[entities].getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// List hook
export function use[Entities](filters: [Filters]) {
  return useQuery({
    queryKey: [entity]Keys.list(filters),
    queryFn: () => api.[entities].list(filters),
  });
}

// Mutation hook
export function useCreate[Entity]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Create[Entity]Input) => api.[entities].create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entity]Keys.lists() });
    },
  });
}
```

### Form Hook Template (React Hook Form + Zod)
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const [Form]Schema = z.object({
  [field]: z.string().min(1, '[Field] is required'),
  [emailField]: z.string().email('Invalid email'),
  [numberField]: z.number().positive('Must be positive'),
});

type [Form]Values = z.infer<typeof [Form]Schema>;

export function use[Form]Form(onSubmit: (data: [Form]Values) => void) {
  const form = useForm<[Form]Values>({
    resolver: zodResolver([Form]Schema),
    defaultValues: {
      [field]: '',
      [emailField]: '',
      [numberField]: 0,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return {
    ...form,
    handleSubmit,
  };
}
```

### Test Template (React Testing Library)
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { [ComponentName] } from './[ComponentName]';

describe('[ComponentName]', () => {
  const defaultProps: [ComponentName]Props = {
    [prop]: [defaultValue],
    on[Event]: vi.fn(),
  };

  const renderComponent = (props: Partial<[ComponentName]Props> = {}) => {
    const user = userEvent.setup();
    const result = render(<[ComponentName] {...defaultProps} {...props} />);
    return { user, ...result };
  };

  it('should render [expected element]', () => {
    renderComponent();
    expect(screen.getByRole('[role]', { name: /[name]/i })).toBeInTheDocument();
  });

  it('should call on[Event] when [action]', async () => {
    const on[Event] = vi.fn();
    const { user } = renderComponent({ on[Event] });

    await user.click(screen.getByRole('button', { name: /[action]/i }));

    expect(on[Event]).toHaveBeenCalledWith([expectedValue]);
  });

  it('should display error state when [condition]', () => {
    renderComponent({ error: new Error('Test error') });
    expect(screen.getByRole('alert')).toHaveTextContent('Test error');
  });
});
```

## Anti-Patterns

### ❌ Mutating State Directly
```tsx
// DON'T: Mutate state
const [items, setItems] = useState<Item[]>([]);

const addItem = (item: Item) => {
  items.push(item); // MUTATION!
  setItems(items);  // Won't trigger re-render
};
```

### ✅ Immutable State Updates
```tsx
// DO: Immutable updates
const [items, setItems] = useState<Item[]>([]);

const addItem = (item: Item) => {
  setItems(prev => [...prev, item]);
};

const updateItem = (id: string, updates: Partial<Item>) => {
  setItems(prev => prev.map(item =>
    item.id === id ? { ...item, ...updates } : item
  ));
};

const removeItem = (id: string) => {
  setItems(prev => prev.filter(item => item.id !== id));
};
```

---

### ❌ Prop Drilling
```tsx
// DON'T: Pass props through many layers
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Layout>
</App>
```

### ✅ Context for Cross-Cutting Concerns
```tsx
// DO: Use context for shared state
<UserProvider user={user}>
  <App>
    <Layout>
      <Sidebar>
        <UserMenu /> {/* Uses useUser() hook */}
      </Sidebar>
    </Layout>
  </App>
</UserProvider>
```

---

### ❌ useEffect for Data Fetching
```tsx
// DON'T: Manual data fetching in useEffect
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  fetchData(id)
    .then(data => !cancelled && setData(data))
    .catch(err => !cancelled && setError(err))
    .finally(() => !cancelled && setLoading(false));
  return () => { cancelled = true; };
}, [id]);
```

### ✅ React Query for Server State
```tsx
// DO: Use React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['data', id],
  queryFn: () => fetchData(id),
});
```

---

### ❌ Inline Object/Array Props
```tsx
// DON'T: Creates new reference every render
<Component style={{ color: 'red' }} items={[1, 2, 3]} />
```

### ✅ Stable References
```tsx
// DO: Stable references
const style = useMemo(() => ({ color: 'red' }), []);
const items = useMemo(() => [1, 2, 3], []);

<Component style={style} items={items} />

// Or define outside component if truly static
const STATIC_STYLE = { color: 'red' } as const;
const STATIC_ITEMS = [1, 2, 3] as const;
```

---

### ❌ Missing Keys in Lists
```tsx
// DON'T: Use index as key
{items.map((item, index) => (
  <Item key={index} data={item} />
))}
```

### ✅ Stable Unique Keys
```tsx
// DO: Use stable unique identifier
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

---

### ❌ Business Logic in Components
```tsx
// DON'T: Logic mixed with UI
const PaymentForm = () => {
  const handleSubmit = async (data) => {
    const validated = validatePayment(data);
    const taxed = calculateTax(validated);
    const response = await api.payments.create(taxed);
    // ... more business logic
  };
};
```

### ✅ Separate Logic into Hooks/Services
```tsx
// DO: Extract business logic
const PaymentForm = () => {
  const { mutate: createPayment } = useCreatePayment();
  const handleSubmit = (data: PaymentFormData) => {
    createPayment(data);
  };
};

// Business logic in dedicated hook/service
function useCreatePayment() {
  return useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const validated = paymentService.validate(data);
      const withTax = paymentService.calculateTax(validated);
      return api.payments.create(withTax);
    },
  });
}
```

## React-Specific Rules

### Component Organization
```
src/
├── components/           # Shared/reusable components
│   ├── ui/              # Primitive UI components (Button, Input, etc.)
│   ├── forms/           # Form components
│   └── layout/          # Layout components (Header, Sidebar, etc.)
├── features/            # Feature-based modules
│   └── [feature]/
│       ├── components/  # Feature-specific components
│       ├── hooks/       # Feature-specific hooks
│       ├── api/         # API calls for this feature
│       └── types.ts     # Feature types
├── hooks/               # Shared custom hooks
├── contexts/            # React contexts
├── services/            # Business logic services
├── utils/               # Utility functions
└── types/               # Shared TypeScript types
```

### Naming Conventions
```
PascalCase.tsx          # React components
useCamelCase.ts         # Custom hooks
camelCase.ts            # Utilities and services
[Component].test.tsx    # Component tests
[Component].stories.tsx # Storybook stories
```

### Performance Rules
1. **Memoize expensive computations** with `useMemo`
2. **Memoize callbacks** with `useCallback` when passed to optimized children
3. **Use React.memo** for components that render often with same props
4. **Virtualize long lists** with react-window or @tanstack/virtual
5. **Code-split routes** with React.lazy and Suspense

### Accessibility Requirements
- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`button`, `nav`, `main`, etc.)
- Provide `aria-label` for icon-only buttons
- Ensure color contrast meets WCAG AA standards
- Test with screen reader (VoiceOver, NVDA)

## Recommended Libraries

| Purpose | Library | Why |
|---------|---------|-----|
| State management | Zustand / Jotai | Simple, performant, TypeScript-native |
| Server state | @tanstack/react-query | Caching, deduplication, background refresh |
| Forms | react-hook-form + zod | Performant, validation, type inference |
| Styling | Tailwind CSS | Utility-first, no runtime overhead |
| Animation | Framer Motion | Declarative, performant |
| Testing | Vitest + Testing Library | Fast, user-centric testing |
| Routing | React Router / TanStack Router | Type-safe, nested routes |

## Testing Guidelines

### What to Test
- User interactions (clicks, typing, form submission)
- Conditional rendering
- Error states and loading states
- Accessibility (roles, labels)

### What NOT to Test
- Implementation details (internal state, private methods)
- Third-party library internals
- Styling (unless critical to functionality)
- Snapshot tests (brittle, low value)

### Testing Priorities
1. **Integration tests** — Test features as users experience them
2. **Unit tests** — Test complex hooks and utility functions
3. **E2E tests** — Critical user journeys only
