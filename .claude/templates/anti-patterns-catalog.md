# Anti-Patterns Catalog

Reference catalog of common anti-patterns to include in claude.md. Each entry shows the problem, why it's problematic, and the correct alternative.

## Testing Anti-Patterns

### Testing Implementation Details
**Problem:** Tests that verify internal method calls, private state, or implementation choices.

```typescript
// ❌ ANTI-PATTERN: Testing implementation
it('should call validateEmail', () => {
  const spy = jest.spyOn(userService, 'validateEmail');
  userService.createUser({ email: 'test@example.com' });
  expect(spy).toHaveBeenCalled();
});

// ❌ ANTI-PATTERN: Testing private state
it('should set internal flag', () => {
  const user = userService.createUser({ email: 'test@example.com' });
  expect(user['_isValidated']).toBe(true);  // Accessing private property
});
```

**Why it's bad:** Tests break on refactoring even when behavior is unchanged. Creates coupling between tests and implementation.

```typescript
// ✅ CORRECT: Test observable behavior
it('should reject invalid email formats', () => {
  const result = userService.createUser({ email: 'not-an-email' });
  expect(result.ok).toBe(false);
  expect(result.error).toBeInstanceOf(InvalidEmailError);
});

it('should create user with valid email', () => {
  const result = userService.createUser({ email: 'test@example.com' });
  expect(result.ok).toBe(true);
  expect(result.value.email).toBe('test@example.com');
});
```

---

### Test Setup with let/beforeEach
**Problem:** Mutable test state that changes between tests, making tests interdependent.

```typescript
// ❌ ANTI-PATTERN: Mutable shared state
describe('PaymentService', () => {
  let payment: Payment;
  let service: PaymentService;

  beforeEach(() => {
    payment = new Payment({ amount: 100 });
    service = new PaymentService();
  });

  it('test one', () => {
    payment.amount = 200;  // Mutates shared state
    // ...
  });

  it('test two', () => {
    // Relies on payment.amount being 100, but is it?
  });
});
```

**Why it's bad:** Tests can affect each other. Hard to understand test in isolation. Order-dependent failures.

```typescript
// ✅ CORRECT: Factory functions with defaults
const createPayment = (overrides: Partial<PaymentData> = {}): Payment => {
  return Payment.reconstitute({
    id: 'pay_test_123',
    amount: 100,
    currency: 'GBP',
    status: 'pending',
    ...overrides,
  });
};

describe('PaymentService', () => {
  it('test one', () => {
    const payment = createPayment({ amount: 200 });
    // Fresh instance, no shared state
  });

  it('test two', () => {
    const payment = createPayment();  // Clean default
    // Completely independent
  });
});
```

---

### Redefining Schemas in Tests
**Problem:** Creating separate schema definitions in tests that can drift from production.

```typescript
// ❌ ANTI-PATTERN: Duplicate schema in test
// In test file:
const TestUserSchema = z.object({
  id: z.string(),
  email: z.string(),  // Missing .email() validation!
  name: z.string(),
});

it('should validate user', () => {
  const user = TestUserSchema.parse({ id: '1', email: 'invalid', name: 'Test' });
  // Test passes but production would fail
});
```

**Why it's bad:** Test schema can diverge from production. Bugs slip through when validation differs.

```typescript
// ✅ CORRECT: Import production schema
import { UserSchema } from '@/domain/schemas/user.schema';

it('should validate user', () => {
  const user = UserSchema.parse({ id: '1', email: 'test@example.com', name: 'Test' });
  // Uses exact same validation as production
});

// Factory validates with real schema
const createUser = (overrides: Partial<UserData> = {}): User => {
  const data = { ...defaultUserData, ...overrides };
  UserSchema.parse(data);  // Catches invalid test data early
  return User.reconstitute(data);
};
```

---

## Code Structure Anti-Patterns

### Deep Nesting
**Problem:** Multiple levels of conditional nesting making code hard to follow.

```typescript
// ❌ ANTI-PATTERN: Deep nesting
function processOrder(order: Order): Result {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        if (order.customer) {
          if (order.customer.isActive) {
            if (order.total > 0) {
              // Actual logic buried 6 levels deep
              return processValidOrder(order);
            }
          }
        }
      }
    }
  }
  return { ok: false, error: 'Invalid order' };
}
```

**Why it's bad:** Hard to read, hard to test individual branches, easy to miss edge cases.

```typescript
// ✅ CORRECT: Guard clauses / early returns
function processOrder(order: Order): Result {
  if (!order) return { ok: false, error: 'Order is required' };
  if (!order.items?.length) return { ok: false, error: 'Order has no items' };
  if (!order.customer) return { ok: false, error: 'Customer is required' };
  if (!order.customer.isActive) return { ok: false, error: 'Customer is inactive' };
  if (order.total <= 0) return { ok: false, error: 'Invalid order total' };

  // Happy path is clear and at top level
  return processValidOrder(order);
}
```

---

### Magic Numbers/Strings
**Problem:** Unexplained literal values scattered through code.

```typescript
// ❌ ANTI-PATTERN: Magic values
if (user.age >= 18 && user.failedAttempts < 3 && amount <= 10000) {
  if (status === 'P') {
    await delay(5000);
    // What do any of these values mean?
  }
}
```

**Why it's bad:** No context for values. Same value might mean different things. Easy to use wrong value.

```typescript
// ✅ CORRECT: Named constants with context
const MINIMUM_AGE_YEARS = 18;
const MAX_LOGIN_ATTEMPTS = 3;
const TRANSACTION_LIMIT_PENCE = 10000;  // £100.00
const PENDING_STATUS = 'P';
const RATE_LIMIT_DELAY_MS = 5000;

if (
  user.age >= MINIMUM_AGE_YEARS &&
  user.failedAttempts < MAX_LOGIN_ATTEMPTS &&
  amount <= TRANSACTION_LIMIT_PENCE
) {
  if (status === PENDING_STATUS) {
    await delay(RATE_LIMIT_DELAY_MS);
  }
}
```

---

### God Objects/Functions
**Problem:** Classes or functions that do too many things.

```typescript
// ❌ ANTI-PATTERN: God class
class OrderManager {
  validateOrder(order: Order) { /* 50 lines */ }
  calculateTax(order: Order) { /* 30 lines */ }
  applyDiscounts(order: Order) { /* 40 lines */ }
  processPayment(order: Order) { /* 60 lines */ }
  sendConfirmation(order: Order) { /* 25 lines */ }
  updateInventory(order: Order) { /* 35 lines */ }
  generateInvoice(order: Order) { /* 45 lines */ }
  handleRefund(order: Order) { /* 55 lines */ }
  // 400+ lines, does everything
}
```

**Why it's bad:** Hard to test, hard to change, violates single responsibility, difficult to reuse parts.

```typescript
// ✅ CORRECT: Single responsibility
class OrderValidator {
  validate(order: Order): ValidationResult { /* focused logic */ }
}

class TaxCalculator {
  calculate(order: Order): TaxResult { /* focused logic */ }
}

class PaymentProcessor {
  process(order: Order): PaymentResult { /* focused logic */ }
}

// Orchestration in use case
class ProcessOrderUseCase {
  constructor(
    private validator: OrderValidator,
    private taxCalculator: TaxCalculator,
    private paymentProcessor: PaymentProcessor
  ) {}

  execute(order: Order): Result {
    // Coordinates the pieces
  }
}
```

---

## Mutation Anti-Patterns

### Direct Array Mutation
**Problem:** Modifying arrays in place instead of creating new arrays.

```typescript
// ❌ ANTI-PATTERN: Array mutation
function addItem(cart: Cart, item: Item): void {
  cart.items.push(item);  // Mutates original
  cart.items.sort((a, b) => a.price - b.price);  // More mutation
  cart.items[0].quantity++;  // Nested mutation
}
```

**Why it's bad:** Side effects, hard to track changes, breaks immutability, causes unexpected bugs.

```typescript
// ✅ CORRECT: Immutable array operations
function addItem(cart: Cart, item: Item): Cart {
  const items = [...cart.items, item];
  const sortedItems = [...items].sort((a, b) => a.price - b.price);
  const updatedItems = sortedItems.map((item, i) =>
    i === 0 ? { ...item, quantity: item.quantity + 1 } : item
  );

  return { ...cart, items: updatedItems };
}
```

**Quick reference for immutable alternatives:**
| Mutation | Immutable Alternative |
|----------|----------------------|
| `arr.push(x)` | `[...arr, x]` |
| `arr.pop()` | `arr.slice(0, -1)` |
| `arr.shift()` | `arr.slice(1)` |
| `arr.unshift(x)` | `[x, ...arr]` |
| `arr[i] = x` | `arr.map((item, idx) => idx === i ? x : item)` |
| `arr.sort()` | `[...arr].sort()` |
| `arr.reverse()` | `[...arr].reverse()` |
| `arr.splice()` | `[...arr.slice(0, i), ...arr.slice(i + n)]` |

---

### Direct Object Mutation
**Problem:** Modifying object properties directly.

```typescript
// ❌ ANTI-PATTERN: Object mutation
function updateUser(user: User, changes: Partial<User>): void {
  user.name = changes.name ?? user.name;
  user.email = changes.email ?? user.email;
  user.updatedAt = new Date();
  delete user.temporaryToken;  // Property deletion
}
```

**Why it's bad:** Breaks referential transparency, unexpected side effects, hard to track changes.

```typescript
// ✅ CORRECT: Immutable object updates
function updateUser(user: User, changes: Partial<User>): User {
  const { temporaryToken, ...userWithoutToken } = user;
  return {
    ...userWithoutToken,
    ...changes,
    updatedAt: new Date(),
  };
}
```

---

## TypeScript Anti-Patterns

### Using `any`
**Problem:** Disabling TypeScript's type checking.

```typescript
// ❌ ANTI-PATTERN: Using any
function processData(data: any): any {
  return data.items.map((item: any) => item.value);
}

const result: any = await fetch('/api/data');
```

**Why it's bad:** No type safety, runtime errors, defeats purpose of TypeScript.

```typescript
// ✅ CORRECT: Proper typing
interface DataResponse {
  readonly items: readonly DataItem[];
}

interface DataItem {
  readonly value: number;
}

function processData(data: DataResponse): readonly number[] {
  return data.items.map(item => item.value);
}

// For unknown external data, use Zod
const response = await fetch('/api/data');
const data = DataResponseSchema.parse(await response.json());
```

---

### Interface for Data, Type for Behavior
**Problem:** Using interface and type inconsistently.

```typescript
// ❌ ANTI-PATTERN: Inconsistent usage
interface PaymentData {  // Should be type for data
  id: string;
  amount: number;
}

type PaymentRepository = {  // Should be interface for contracts
  save(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
};
```

**Why it's bad:** Inconsistent patterns, harder to understand intent, TypeScript convention violation.

```typescript
// ✅ CORRECT: Type for data shapes, interface for behavior contracts
type PaymentData = {
  readonly id: string;
  readonly amount: number;
};

interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
}
```

---

### Missing Readonly
**Problem:** Allowing accidental mutation through types.

```typescript
// ❌ ANTI-PATTERN: Mutable types
type Order = {
  id: string;
  items: OrderItem[];  // Can be mutated
  status: OrderStatus;  // Can be reassigned
};

function processOrder(order: Order) {
  order.items.push(newItem);  // Allowed by type
  order.status = 'completed';  // Allowed by type
}
```

**Why it's bad:** Types don't enforce immutability, easy to accidentally mutate.

```typescript
// ✅ CORRECT: Readonly by default
type Order = {
  readonly id: string;
  readonly items: readonly OrderItem[];
  readonly status: OrderStatus;
};

function processOrder(order: Order) {
  // order.items.push(newItem);  // Type error!
  // order.status = 'completed';  // Type error!

  return {
    ...order,
    items: [...order.items, newItem],
    status: 'completed' as const,
  };
}
```

---

## Architecture Anti-Patterns

### Anemic Domain Model
**Problem:** Domain objects that are just data bags with no behavior.

```typescript
// ❌ ANTI-PATTERN: Anemic domain model
class Order {
  id: string;
  items: Item[];
  status: string;
  total: number;
}

class OrderService {
  addItem(order: Order, item: Item) {
    order.items.push(item);
    order.total = this.calculateTotal(order.items);
  }

  approve(order: Order) {
    if (order.status !== 'pending') throw new Error('Invalid state');
    order.status = 'approved';
  }
}
```

**Why it's bad:** Business logic spread across services, entity has no invariants, hard to maintain consistency.

```typescript
// ✅ CORRECT: Rich domain model
class Order {
  private constructor(
    readonly id: OrderId,
    private readonly _items: readonly Item[],
    private _status: OrderStatus
  ) {}

  addItem(item: Item): Order {
    if (this._status !== OrderStatus.Draft) {
      throw new InvalidOrderStateError('Cannot add items to non-draft order');
    }
    return new Order(
      this.id,
      [...this._items, item],
      this._status
    );
  }

  approve(): void {
    if (this._status !== OrderStatus.Pending) {
      throw new InvalidOrderStateError('Can only approve pending orders');
    }
    this._status = OrderStatus.Approved;
  }

  get total(): Money {
    return this._items.reduce(
      (sum, item) => sum.add(item.price),
      Money.zero(this._items[0]?.price.currency ?? 'GBP')
    );
  }
}
```

---

### Leaky Abstractions
**Problem:** Implementation details leaking through abstraction boundaries.

```typescript
// ❌ ANTI-PATTERN: Database details in domain
interface UserRepository {
  // SQL-specific methods leak into domain
  findByQuery(sql: string): Promise<User[]>;
  executeTransaction(queries: string[]): Promise<void>;
}

class UserService {
  async findActiveUsers() {
    // Domain knows about SQL!
    return this.repo.findByQuery('SELECT * FROM users WHERE active = true');
  }
}
```

**Why it's bad:** Domain is coupled to infrastructure, hard to swap implementations, breaks abstraction.

```typescript
// ✅ CORRECT: Clean abstractions
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByStatus(status: UserStatus): Promise<readonly User[]>;
  save(user: User): Promise<void>;
}

class UserService {
  async findActiveUsers() {
    // Domain speaks domain language
    return this.repo.findByStatus(UserStatus.Active);
  }
}

// Infrastructure handles the SQL
class PostgresUserRepository implements UserRepository {
  async findByStatus(status: UserStatus): Promise<readonly User[]> {
    const rows = await this.db.query(
      'SELECT * FROM users WHERE status = $1',
      [status]
    );
    return rows.map(this.toDomain);
  }
}
```

---

### Wrong Abstraction (DRY Misapplication)
**Problem:** Abstracting code that looks similar but has different semantic meaning.

```typescript
// ❌ ANTI-PATTERN: Wrong abstraction
// Both check amount > 0 && amount <= 10000, so we abstract...
const validateAmount = (amount: number, context: string): boolean => {
  const limit = context === 'payment' ? 10000 : 10000;  // Same now but...
  return amount > 0 && amount <= limit;
};

// Later, payment fraud rules change...
// Now we have to add more context, more conditions, more complexity
```

**Why it's bad:** Couples unrelated concepts, becomes complex when requirements diverge, harder to change.

```typescript
// ✅ CORRECT: Keep semantically different code separate
const validatePaymentAmount = (amount: number): boolean => {
  // Fraud prevention rules - might add velocity checks, risk scoring
  return amount > 0 && amount <= FRAUD_LIMIT;
};

const validateTransferAmount = (amount: number): boolean => {
  // Account type rules - might add balance checks, daily limits
  return amount > 0 && amount <= ACCOUNT_LIMIT;
};

// They can evolve independently
```

**Rule:** Only abstract when code shares the same *semantic meaning*, not just structural similarity.
