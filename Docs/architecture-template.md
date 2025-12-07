# architecture.md Template

Use this template as a starting point. Remove sections that don't apply; add project-specific sections as needed.

---

# [Project Name] Architecture

## Overview

[2-3 sentences describing what this system does and its primary architectural approach. Be specific about the problem domain.]

**Example:**
> PaymentProcessor is a transaction processing service using hexagonal architecture. It validates, routes, and settles payments across multiple payment providers while maintaining a clean separation between business logic and external integrations.

## Architecture Pattern

**Pattern:** [Name: Hexagonal / Clean / Layered / Event-Driven / etc.]

**Core Principles:**
- [Principle 1: e.g., "Domain logic has no external dependencies"]
- [Principle 2: e.g., "All I/O goes through ports and adapters"]
- [Principle 3: e.g., "Business rules are testable in isolation"]

**Why This Pattern:**
[1-2 sentences explaining why this pattern fits the problem]

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   HTTP API  │    │   CLI       │    │   Events    │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Domain Layer                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │ Entities  │  │ Services  │  │   Ports   │       │    │
│  │  └───────────┘  └───────────┘  └───────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Database   │    │  External   │    │   Cache     │     │
│  │  Adapter    │    │  API Adapter│    │   Adapter   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

[Customize this diagram for your actual architecture]

## Layer Responsibilities

### Domain Layer
- **Purpose:** Contains business logic and rules; has no external dependencies
- **Contains:** Entities, Value Objects, Domain Services, Repository Ports
- **Dependencies:** None (pure business logic)
- **Example files:** `domain/entities/`, `domain/services/`, `domain/ports/`

### Application Layer
- **Purpose:** Orchestrates use cases; coordinates between domain and infrastructure
- **Contains:** Use Cases, Application Services, DTOs
- **Dependencies:** Domain layer only
- **Example files:** `application/use_cases/`, `application/services/`

### Infrastructure Layer
- **Purpose:** Implements external integrations; adapts external systems to ports
- **Contains:** Repository implementations, API clients, database adapters
- **Dependencies:** Domain (implements ports), external libraries
- **Example files:** `infrastructure/repositories/`, `infrastructure/adapters/`

### Presentation Layer
- **Purpose:** Handles user/API interaction; transforms requests/responses
- **Contains:** Controllers, CLI handlers, Event handlers, View models
- **Dependencies:** Application layer
- **Example files:** `api/controllers/`, `cli/commands/`

## Key Patterns

### Entity Pattern
**When to use:** Domain objects with identity that persists over time
```typescript
// Entity: has identity, mutable state through controlled methods
class Payment {
  private constructor(
    readonly id: PaymentId,
    private _status: PaymentStatus,
    readonly amount: Money,
    readonly createdAt: Date
  ) {}

  static create(amount: Money): Payment {
    return new Payment(
      PaymentId.generate(),
      PaymentStatus.Pending,
      amount,
      new Date()
    );
  }

  approve(): void {
    if (this._status !== PaymentStatus.Pending) {
      throw new InvalidStateError('Can only approve pending payments');
    }
    this._status = PaymentStatus.Approved;
  }

  get status(): PaymentStatus {
    return this._status;
  }
}
```

### Value Object Pattern
**When to use:** Immutable objects defined by their attributes, not identity
```typescript
// Value Object: immutable, compared by value
class Money {
  private constructor(
    readonly amount: number,
    readonly currency: Currency
  ) {
    if (amount < 0) throw new ValidationError('Amount cannot be negative');
  }

  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError();
    }
    return Money.of(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

### Port Pattern (Hexagonal)
**When to use:** Define contracts between domain and infrastructure
```typescript
// Port: interface defined in domain layer
interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: PaymentId): Promise<Payment | null>;
  findByStatus(status: PaymentStatus): Promise<readonly Payment[]>;
}

// Adapter: implementation in infrastructure layer
class PostgresPaymentRepository implements PaymentRepository {
  constructor(private db: DatabaseConnection) {}

  async save(payment: Payment): Promise<void> {
    await this.db.query(
      'INSERT INTO payments (id, status, amount, currency) VALUES ($1, $2, $3, $4)',
      [payment.id.value, payment.status, payment.amount.amount, payment.amount.currency]
    );
  }
  // ... other implementations
}
```

### Result Type Pattern
**When to use:** Operations that can fail in expected ways
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function processPayment(payment: Payment): Result<Receipt, PaymentError> {
  if (payment.amount.amount > MAX_AMOUNT) {
    return { ok: false, error: new AmountExceededError(payment.amount) };
  }
  // ... processing logic
  return { ok: true, value: new Receipt(payment.id, new Date()) };
}

// Usage: forces error handling
const result = processPayment(payment);
if (!result.ok) {
  logger.error('Payment failed', { error: result.error });
  return;
}
const receipt = result.value;
```

## Architecture Decision Records

### ADR-001: Hexagonal Architecture
**Date:** [Date]
**Status:** Accepted

**Context:**
We need to integrate with multiple payment providers (Stripe, PayPal, bank APIs) and want to avoid vendor lock-in. Business logic should be testable without external dependencies.

**Decision:**
Adopt hexagonal architecture with ports and adapters. Domain logic defines ports (interfaces); infrastructure implements adapters.

**Consequences:**
- ✅ Business logic is isolated and testable
- ✅ Easy to swap payment providers
- ✅ Clear boundaries between layers
- ⚠️ More boilerplate for simple operations
- ⚠️ Team needs to understand port/adapter pattern

### ADR-002: [Decision Title]
**Date:** [Date]
**Status:** [Proposed | Accepted | Deprecated | Superseded]

**Context:**
[What prompted this decision? What problem needed solving?]

**Decision:**
[What was decided? Be specific.]

**Consequences:**
[What are the trade-offs? Use ✅ for benefits, ⚠️ for drawbacks]

---

For full ADRs, see `docs/adr/` directory.

## Constraints

### Technical Constraints
- Maximum response time: 200ms for API endpoints
- Database: PostgreSQL 14+ (using JSONB for flexible schemas)
- Must support horizontal scaling (stateless services)

### Business Constraints
- PCI-DSS compliance required for payment data
- Audit trail required for all state changes
- Multi-currency support (GBP, USD, EUR minimum)

### Operational Constraints
- Must deploy to Kubernetes
- Observability via OpenTelemetry
- Feature flags via [system name]

## Module Structure

```
src/
├── domain/                 # Business logic (no external deps)
│   ├── entities/          # Domain entities
│   ├── value-objects/     # Immutable value types
│   ├── services/          # Domain services
│   ├── ports/             # Interface definitions
│   └── errors/            # Domain-specific errors
├── application/           # Use case orchestration
│   ├── use-cases/         # Individual use cases
│   ├── services/          # Application services
│   └── dtos/              # Data transfer objects
├── infrastructure/        # External integrations
│   ├── repositories/      # Database implementations
│   ├── adapters/          # External API adapters
│   └── config/            # Configuration loaders
├── api/                   # HTTP API layer
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth, logging, etc.
│   └── validators/        # Request validation
└── tests/
    ├── unit/              # Domain and application tests
    ├── integration/       # Infrastructure tests
    └── e2e/               # Full system tests
```

## External Dependencies

| Dependency | Purpose | Why Chosen |
|------------|---------|------------|
| [Library 1] | [Purpose] | [Rationale] |
| [Library 2] | [Purpose] | [Rationale] |

**Example:**
| Dependency | Purpose | Why Chosen |
|------------|---------|------------|
| Zod | Schema validation | Type inference, composable schemas, good errors |
| Kysely | SQL query builder | Type-safe, no ORM overhead, raw SQL escape hatch |
| Vitest | Testing | Fast, ESM-native, Jest-compatible API |
