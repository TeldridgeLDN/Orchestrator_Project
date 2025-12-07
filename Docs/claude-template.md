# claude.md Template

Use this template as a starting point. Customize heavily for your project's specific needs, tech stack, and team conventions.

---

# Claude Development Guidelines

## Core Principles

**These are non-negotiable. Every change must adhere to these principles.**

1. **TDD is mandatory** — Every line of production code must be written in response to a failing test
2. **Behavior over implementation** — Tests verify what code does, not how it does it
3. **Immutability by default** — Use pure functions and immutable data structures
4. **Explicit over implicit** — Clear code over clever code; no magic

## Workflow

### Development Cycle: RED-GREEN-REFACTOR

Every feature follows this cycle:

1. **RED** — Write a failing test that describes the desired behavior
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Improve the code while keeping tests green

**Quality Gates:**

Before moving RED → GREEN:
- [ ] Test clearly expresses desired behavior
- [ ] Test uses public API only (no implementation details)
- [ ] Test fails for the right reason

Before moving GREEN → REFACTOR:
- [ ] All tests pass
- [ ] No more code than necessary to pass tests
- [ ] No premature optimization

Before committing:
- [ ] All tests pass
- [ ] Code is formatted (`npm run format` or equivalent)
- [ ] Linting passes (`npm run lint` or equivalent)
- [ ] No `any` types added
- [ ] No commented-out code

### Git Commit Conventions

**Format:** `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(payments): add multi-currency support
fix(auth): handle expired token refresh
refactor(domain): extract Money value object
test(payments): add edge cases for negative amounts
```

**Rules:**
- Use imperative mood: "add feature" not "added feature"
- Keep subject line under 72 characters
- Reference issue numbers where applicable: `feat(auth): add SSO support (#123)`

### Branch Naming

```
feature/[ticket-id]-short-description
bugfix/[ticket-id]-short-description
refactor/short-description
```

**Examples:**
```
feature/PAY-123-multi-currency
bugfix/PAY-456-negative-amount-crash
refactor/extract-value-objects
```

## Code Patterns

### Entity Template
```typescript
class [EntityName] {
  private constructor(
    readonly id: [EntityName]Id,
    private _[mutableField]: [Type],
    readonly [immutableField]: [Type]
  ) {}

  static create([params]): [EntityName] {
    // Validation logic
    return new [EntityName](
      [EntityName]Id.generate(),
      [initialValue],
      [param]
    );
  }

  static reconstitute(data: [EntityName]Data): [EntityName] {
    // For loading from persistence - no validation
    return new [EntityName](
      [EntityName]Id.from(data.id),
      data.[field],
      data.[field]
    );
  }

  [action](): void {
    // State transition with validation
    if (!this.can[Action]()) {
      throw new Invalid[EntityName]StateError(this._state, '[action]');
    }
    this._[field] = [newValue];
  }

  private can[Action](): boolean {
    return this._state === [ValidState];
  }

  get [field](): [Type] {
    return this._[field];
  }
}
```

### Value Object Template
```typescript
class [ValueObjectName] {
  private constructor(
    readonly [field1]: [Type],
    readonly [field2]: [Type]
  ) {
    // Validation in constructor
    if ([invalidCondition]) {
      throw new [ValidationError]('[field] must be [constraint]');
    }
  }

  static of([params]): [ValueObjectName] {
    return new [ValueObjectName]([params]);
  }

  // Behavior methods return new instances
  [operation]([params]): [ValueObjectName] {
    return [ValueObjectName].of([newValues]);
  }

  equals(other: [ValueObjectName]): boolean {
    return this.[field1] === other.[field1] && this.[field2] === other.[field2];
  }

  toString(): string {
    return `[formatted representation]`;
  }
}
```

### Port (Repository Interface) Template
```typescript
interface [EntityName]Repository {
  save(entity: [EntityName]): Promise<void>;
  findById(id: [EntityName]Id): Promise<[EntityName] | null>;
  findBy[Criteria]([params]): Promise<readonly [EntityName][]>;
  delete(id: [EntityName]Id): Promise<void>;
}
```

### Use Case Template
```typescript
interface [UseCaseName]Input {
  readonly [field]: [Type];
}

interface [UseCaseName]Output {
  readonly [field]: [Type];
}

class [UseCaseName] {
  constructor(
    private readonly [repository]: [Repository],
    private readonly [service]: [Service]
  ) {}

  async execute(input: [UseCaseName]Input): Promise<Result<[UseCaseName]Output, [ErrorType]>> {
    // 1. Validate input
    const validated = [Schema].safeParse(input);
    if (!validated.success) {
      return { ok: false, error: new ValidationError(validated.error) };
    }

    // 2. Execute business logic
    const entity = await this.[repository].findById(input.id);
    if (!entity) {
      return { ok: false, error: new NotFoundError('[Entity]', input.id) };
    }

    // 3. Perform action
    entity.[action]();

    // 4. Persist changes
    await this.[repository].save(entity);

    // 5. Return result
    return { ok: true, value: { [field]: entity.[field] } };
  }
}
```

### Test Factory Template
```typescript
// factories/[entity].factory.ts
const defaultPayment: PaymentData = {
  id: 'pay_test_123',
  amount: 1000,
  currency: 'GBP',
  status: 'pending',
  createdAt: new Date('2024-01-01'),
};

function createPayment(overrides: Partial<PaymentData> = {}): Payment {
  const data = { ...defaultPayment, ...overrides };
  // Validate with schema to catch test data errors
  PaymentDataSchema.parse(data);
  return Payment.reconstitute(data);
}

// Usage in tests
it('should reject already approved payments', () => {
  const payment = createPayment({ status: 'approved' });
  expect(() => payment.approve()).toThrow(InvalidPaymentStateError);
});
```

## Anti-Patterns

### ❌ Testing Implementation Details
```typescript
// DON'T: Test internal method calls
it('should call validateAmount', () => {
  const spy = jest.spyOn(validator, 'validateAmount');
  processPayment(payment);
  expect(spy).toHaveBeenCalled();
});
```

### ✅ Test Behavior Instead
```typescript
// DO: Test observable behavior
it('should reject payments with negative amounts', () => {
  const payment = createPayment({ amount: -100 });
  const result = processPayment(payment);
  expect(result.ok).toBe(false);
  expect(result.error).toBeInstanceOf(InvalidAmountError);
});
```

---

### ❌ Mutable State
```typescript
// DON'T: Mutate arrays and objects
function addItem(cart: Cart, item: Item): void {
  cart.items.push(item);  // Mutation!
  cart.total = calculateTotal(cart.items);  // Mutation!
}
```

### ✅ Immutable Operations
```typescript
// DO: Return new instances
function addItem(cart: Cart, item: Item): Cart {
  const items = [...cart.items, item];
  return {
    ...cart,
    items,
    total: calculateTotal(items),
  };
}
```

---

### ❌ Using `any`
```typescript
// DON'T: Use any
function process(data: any): any {
  return data.value;
}
```

### ✅ Use Proper Types
```typescript
// DO: Define explicit types
interface ProcessInput {
  readonly value: number;
}

interface ProcessOutput {
  readonly result: number;
}

function process(data: ProcessInput): ProcessOutput {
  return { result: data.value * 2 };
}
```

---

### ❌ Interface for Data
```typescript
// DON'T: Use interface for data structures
interface PaymentData {
  id: string;
  amount: number;
}
```

### ✅ Use Type for Data, Interface for Behavior
```typescript
// DO: Type for data shapes
type PaymentData = {
  readonly id: string;
  readonly amount: number;
};

// DO: Interface for contracts/behavior
interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
}
```

---

### ❌ Deep Nesting
```typescript
// DON'T: Deep nesting (>3 levels)
function process(order: Order): Result {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        if (order.status === 'pending') {
          // actual logic buried here
        }
      }
    }
  }
}
```

### ✅ Early Returns
```typescript
// DO: Guard clauses and early returns
function process(order: Order): Result {
  if (!order) return { ok: false, error: 'No order' };
  if (!order.items?.length) return { ok: false, error: 'No items' };
  if (order.status !== 'pending') return { ok: false, error: 'Wrong status' };

  // Clear path to actual logic
  return processValidOrder(order);
}
```

---

### ❌ Magic Numbers
```typescript
// DON'T: Magic numbers
if (amount > 10000) {
  requireApproval();
}
```

### ✅ Named Constants
```typescript
// DO: Named constants with context
const APPROVAL_THRESHOLD_PENCE = 10000; // £100.00

if (amount > APPROVAL_THRESHOLD_PENCE) {
  requireApproval();
}
```

---

### ❌ Comments Explaining What
```typescript
// DON'T: Comments that explain what (code should be self-documenting)
// Loop through items and calculate total
let total = 0;
for (const item of items) {
  total += item.price;
}
```

### ✅ Self-Documenting Code (or Comments Explaining Why)
```typescript
// DO: Self-documenting code
const total = items.reduce((sum, item) => sum + item.price, 0);

// Or if comment needed, explain WHY not WHAT:
// HMRC requires rounding to whole pence before VAT calculation
const roundedAmount = Math.floor(amount);
```

## TypeScript Rules

### Schema Usage (When Required)
Use schemas (Zod) when:
1. Data crosses a trust boundary (API input, external service response)
2. Type has validation rules (email format, positive number)
3. Shared data contract between systems
4. Used in test factories (validates test data)

```typescript
// Trust boundary: API input
const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['GBP', 'USD', 'EUR']),
});

// Internal types: no schema needed
type CalculationResult = {
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
};
```

### Readonly by Default
```typescript
// All types should use readonly
type PaymentData = {
  readonly id: string;
  readonly amount: number;
  readonly items: readonly PaymentItem[];
};

// Function parameters: readonly arrays
function processItems(items: readonly Item[]): ProcessedItems {
  // Can't accidentally mutate
}
```

### Options Objects for 3+ Parameters
```typescript
// DON'T: Positional parameters
createPayment(100, 'GBP', 'card_123', 'cust_456', undefined, { orderId: '789' });

// DO: Options object
createPayment({
  amount: 100,
  currency: 'GBP',
  cardId: 'card_123',
  customerId: 'cust_456',
  metadata: { orderId: '789' },
});
```

## Domain-Specific Rules

[Add your project-specific rules here]

**Example:**
- All monetary amounts are stored in pence (integer), not pounds (float)
- Customer IDs follow format: `cust_[a-z0-9]{14}`
- Payment states must follow: `pending` → `approved` | `rejected` → `settled` | `refunded`
- Audit events are immutable once created

## Gotchas

[Add non-obvious behaviors discovered during development]

**Example:**
- Stripe webhook events can arrive out of order — always check current state before processing
- PostgreSQL JSONB doesn't preserve key order — don't rely on object key ordering
- Jest mock timers don't advance automatically — use `jest.advanceTimersByTime()` explicitly
- Zod `.parse()` strips unknown keys by default — use `.passthrough()` if you need them

## Testing Guidelines

### Test Naming Convention
```typescript
describe('[Unit Under Test]', () => {
  describe('[method or scenario]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Test Structure
```typescript
it('should reject payments exceeding daily limit', () => {
  // Arrange: Set up test data using factories
  const customer = createCustomer({ dailySpent: 9000 });
  const payment = createPayment({ amount: 2000 });

  // Act: Execute the behavior being tested
  const result = paymentService.process(payment, customer);

  // Assert: Verify the expected outcome
  expect(result.ok).toBe(false);
  expect(result.error).toBeInstanceOf(DailyLimitExceededError);
  expect(result.error.message).toContain('daily limit');
});
```

### What NOT to Test
- Private methods (test through public API)
- Framework code (e.g., Express routing)
- Type definitions (TypeScript handles this)
- Third-party library internals

## File Naming

```
kebab-case.ts           # All files
[name].test.ts          # Tests next to source
[name].factory.ts       # Test factories
[name].schema.ts        # Zod schemas
[name].types.ts         # Type definitions (if separate)
```
