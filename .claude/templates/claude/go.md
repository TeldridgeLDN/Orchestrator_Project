# Claude Development Guidelines - Go

## Core Principles

**These are non-negotiable. Every change must adhere to these principles.**

1. **TDD is mandatory** — Every line of production code must be written in response to a failing test
2. **Behavior over implementation** — Tests verify what code does, not how it does it
3. **Simplicity over cleverness** — Clear, idiomatic Go over clever abstractions
4. **Explicit error handling** — Handle every error; no ignored returns
5. **Composition over inheritance** — Use interfaces and embedding, not class hierarchies

## Workflow

### Development Cycle: RED-GREEN-REFACTOR

Every feature follows this cycle:

1. **RED** — Write a failing test that describes the desired behavior
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Improve the code while keeping tests green

**Quality Gates:**

Before committing:
- [ ] All tests pass (`go test ./...`)
- [ ] No vet warnings (`go vet ./...`)
- [ ] No lint warnings (`golangci-lint run`)
- [ ] Code is formatted (`gofmt -s -w .`)
- [ ] No ignored errors
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

## Code Patterns

### Entity Pattern
```go
package domain

import (
    "errors"
    "time"

    "github.com/google/uuid"
)

// PaymentID is a value object representing a payment identifier.
type PaymentID struct {
    value uuid.UUID
}

// NewPaymentID creates a new random PaymentID.
func NewPaymentID() PaymentID {
    return PaymentID{value: uuid.New()}
}

// ParsePaymentID creates a PaymentID from a string.
func ParsePaymentID(s string) (PaymentID, error) {
    id, err := uuid.Parse(s)
    if err != nil {
        return PaymentID{}, ErrInvalidPaymentID
    }
    return PaymentID{value: id}, nil
}

// String returns the string representation.
func (p PaymentID) String() string {
    return p.value.String()
}

// PaymentStatus represents the state of a payment.
type PaymentStatus string

const (
    PaymentStatusPending  PaymentStatus = "pending"
    PaymentStatusApproved PaymentStatus = "approved"
    PaymentStatusRejected PaymentStatus = "rejected"
    PaymentStatusSettled  PaymentStatus = "settled"
)

// Payment is a domain entity representing a payment.
type Payment struct {
    id        PaymentID
    status    PaymentStatus
    amount    Money
    createdAt time.Time
}

// NewPayment creates a new Payment with pending status.
func NewPayment(amount Money) *Payment {
    return &Payment{
        id:        NewPaymentID(),
        status:    PaymentStatusPending,
        amount:    amount,
        createdAt: time.Now(),
    }
}

// Approve transitions the payment to approved status.
func (p *Payment) Approve() error {
    if p.status != PaymentStatusPending {
        return &InvalidStateError{
            Current: string(p.status),
            Action:  "approve",
        }
    }
    p.status = PaymentStatusApproved
    return nil
}

// ID returns the payment ID.
func (p *Payment) ID() PaymentID { return p.id }

// Status returns the current status.
func (p *Payment) Status() PaymentStatus { return p.status }

// Amount returns the payment amount.
func (p *Payment) Amount() Money { return p.amount }
```

### Value Object Pattern
```go
package domain

import (
    "errors"
    "fmt"
)

// Currency represents a supported currency.
type Currency string

const (
    CurrencyGBP Currency = "GBP"
    CurrencyUSD Currency = "USD"
    CurrencyEUR Currency = "EUR"
)

// Money is a value object representing a monetary amount.
type Money struct {
    amount   int64 // In smallest unit (pence, cents)
    currency Currency
}

// NewMoney creates a new Money value.
func NewMoney(amount int64, currency Currency) (Money, error) {
    if amount < 0 {
        return Money{}, ErrNegativeAmount
    }
    return Money{amount: amount, currency: currency}, nil
}

// MustNewMoney creates a Money value, panicking on error.
// Use only in tests or initialization.
func MustNewMoney(amount int64, currency Currency) Money {
    m, err := NewMoney(amount, currency)
    if err != nil {
        panic(err)
    }
    return m
}

// Zero returns a zero Money for the given currency.
func Zero(currency Currency) Money {
    return Money{amount: 0, currency: currency}
}

// Add adds two Money values of the same currency.
func (m Money) Add(other Money) (Money, error) {
    if m.currency != other.currency {
        return Money{}, &CurrencyMismatchError{
            Left:  m.currency,
            Right: other.currency,
        }
    }
    return Money{
        amount:   m.amount + other.amount,
        currency: m.currency,
    }, nil
}

// Amount returns the amount in smallest units.
func (m Money) Amount() int64 { return m.amount }

// Currency returns the currency.
func (m Money) Currency() Currency { return m.currency }

// String returns a formatted string representation.
func (m Money) String() string {
    symbols := map[Currency]string{
        CurrencyGBP: "£",
        CurrencyUSD: "$",
        CurrencyEUR: "€",
    }
    major := m.amount / 100
    minor := m.amount % 100
    return fmt.Sprintf("%s%d.%02d", symbols[m.currency], major, minor)
}
```

### Port (Interface) Pattern
```go
package domain

import "context"

// PaymentRepository defines the interface for payment persistence.
type PaymentRepository interface {
    Save(ctx context.Context, payment *Payment) error
    FindByID(ctx context.Context, id PaymentID) (*Payment, error)
    FindByStatus(ctx context.Context, status PaymentStatus) ([]*Payment, error)
    Delete(ctx context.Context, id PaymentID) error
}

// PaymentGateway defines the interface for payment processing.
type PaymentGateway interface {
    Charge(ctx context.Context, amount Money, token string) (*ChargeResult, error)
    Refund(ctx context.Context, chargeID string) error
}
```

### Adapter Implementation
```go
package postgres

import (
    "context"
    "database/sql"
    "time"

    "yourproject/domain"
)

// PaymentRepository implements domain.PaymentRepository using PostgreSQL.
type PaymentRepository struct {
    db *sql.DB
}

// NewPaymentRepository creates a new PostgreSQL payment repository.
func NewPaymentRepository(db *sql.DB) *PaymentRepository {
    return &PaymentRepository{db: db}
}

// Save persists a payment to the database.
func (r *PaymentRepository) Save(ctx context.Context, payment *domain.Payment) error {
    query := `
        INSERT INTO payments (id, status, amount, currency, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET status = $2
    `
    _, err := r.db.ExecContext(ctx, query,
        payment.ID().String(),
        string(payment.Status()),
        payment.Amount().Amount(),
        string(payment.Amount().Currency()),
        payment.CreatedAt(),
    )
    if err != nil {
        return fmt.Errorf("failed to save payment: %w", err)
    }
    return nil
}

// FindByID retrieves a payment by its ID.
func (r *PaymentRepository) FindByID(ctx context.Context, id domain.PaymentID) (*domain.Payment, error) {
    query := `SELECT id, status, amount, currency, created_at FROM payments WHERE id = $1`
    row := r.db.QueryRowContext(ctx, query, id.String())

    var (
        idStr     string
        status    string
        amount    int64
        currency  string
        createdAt time.Time
    )
    if err := row.Scan(&idStr, &status, &amount, &currency, &createdAt); err != nil {
        if err == sql.ErrNoRows {
            return nil, domain.ErrPaymentNotFound
        }
        return nil, fmt.Errorf("failed to find payment: %w", err)
    }

    return r.toDomain(idStr, status, amount, currency, createdAt)
}
```

### Error Handling Pattern
```go
package domain

import (
    "errors"
    "fmt"
)

// Sentinel errors for common cases.
var (
    ErrInvalidPaymentID = errors.New("invalid payment ID")
    ErrNegativeAmount   = errors.New("amount cannot be negative")
    ErrPaymentNotFound  = errors.New("payment not found")
)

// InvalidStateError indicates an invalid state transition.
type InvalidStateError struct {
    Current string
    Action  string
}

func (e *InvalidStateError) Error() string {
    return fmt.Sprintf("cannot %s payment in state %s", e.Action, e.Current)
}

// CurrencyMismatchError indicates a currency mismatch.
type CurrencyMismatchError struct {
    Left  Currency
    Right Currency
}

func (e *CurrencyMismatchError) Error() string {
    return fmt.Sprintf("cannot combine %s and %s", e.Left, e.Right)
}

// ValidationError wraps validation failures.
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: %s - %s", e.Field, e.Message)
}
```

### Use Case Pattern
```go
package application

import (
    "context"
    "fmt"

    "yourproject/domain"
)

// ProcessPaymentInput is the input for ProcessPayment use case.
type ProcessPaymentInput struct {
    PaymentID string
}

// ProcessPaymentOutput is the output of ProcessPayment use case.
type ProcessPaymentOutput struct {
    Status    string
    ReceiptID *string
}

// ProcessPaymentUseCase handles payment processing.
type ProcessPaymentUseCase struct {
    paymentRepo domain.PaymentRepository
}

// NewProcessPaymentUseCase creates a new ProcessPaymentUseCase.
func NewProcessPaymentUseCase(repo domain.PaymentRepository) *ProcessPaymentUseCase {
    return &ProcessPaymentUseCase{paymentRepo: repo}
}

// Execute processes a payment.
func (uc *ProcessPaymentUseCase) Execute(ctx context.Context, input ProcessPaymentInput) (*ProcessPaymentOutput, error) {
    // 1. Parse and validate input
    paymentID, err := domain.ParsePaymentID(input.PaymentID)
    if err != nil {
        return nil, fmt.Errorf("invalid payment ID: %w", err)
    }

    // 2. Fetch entity
    payment, err := uc.paymentRepo.FindByID(ctx, paymentID)
    if err != nil {
        return nil, fmt.Errorf("failed to find payment: %w", err)
    }

    // 3. Execute domain logic
    if err := payment.Approve(); err != nil {
        return nil, err
    }

    // 4. Persist changes
    if err := uc.paymentRepo.Save(ctx, payment); err != nil {
        return nil, fmt.Errorf("failed to save payment: %w", err)
    }

    // 5. Return result
    return &ProcessPaymentOutput{
        Status:    string(payment.Status()),
        ReceiptID: nil, // Would generate receipt
    }, nil
}
```

### Test Pattern
```go
package domain_test

import (
    "testing"

    "yourproject/domain"
)

// Test factories
func createPayment(t *testing.T, status domain.PaymentStatus) *domain.Payment {
    t.Helper()
    payment := domain.NewPayment(createMoney(t, 1000, domain.CurrencyGBP))
    // Set status via internal method for testing (or use reconstitute)
    return payment
}

func createMoney(t *testing.T, amount int64, currency domain.Currency) domain.Money {
    t.Helper()
    m, err := domain.NewMoney(amount, currency)
    if err != nil {
        t.Fatalf("failed to create money: %v", err)
    }
    return m
}

func TestPayment_Approve(t *testing.T) {
    t.Run("succeeds for pending payment", func(t *testing.T) {
        payment := domain.NewPayment(createMoney(t, 1000, domain.CurrencyGBP))

        err := payment.Approve()

        if err != nil {
            t.Errorf("expected no error, got %v", err)
        }
        if payment.Status() != domain.PaymentStatusApproved {
            t.Errorf("expected status %v, got %v", domain.PaymentStatusApproved, payment.Status())
        }
    })

    t.Run("fails for non-pending payment", func(t *testing.T) {
        payment := createPaymentWithStatus(t, domain.PaymentStatusApproved)

        err := payment.Approve()

        if err == nil {
            t.Error("expected error, got nil")
        }
        var stateErr *domain.InvalidStateError
        if !errors.As(err, &stateErr) {
            t.Errorf("expected InvalidStateError, got %T", err)
        }
    })
}

func TestMoney_Add(t *testing.T) {
    t.Run("succeeds for same currency", func(t *testing.T) {
        a := createMoney(t, 100, domain.CurrencyGBP)
        b := createMoney(t, 200, domain.CurrencyGBP)

        result, err := a.Add(b)

        if err != nil {
            t.Fatalf("unexpected error: %v", err)
        }
        if result.Amount() != 300 {
            t.Errorf("expected amount 300, got %d", result.Amount())
        }
        if result.Currency() != domain.CurrencyGBP {
            t.Errorf("expected currency GBP, got %v", result.Currency())
        }
    })

    t.Run("fails for different currencies", func(t *testing.T) {
        a := createMoney(t, 100, domain.CurrencyGBP)
        b := createMoney(t, 200, domain.CurrencyUSD)

        _, err := a.Add(b)

        if err == nil {
            t.Error("expected error, got nil")
        }
        var mismatchErr *domain.CurrencyMismatchError
        if !errors.As(err, &mismatchErr) {
            t.Errorf("expected CurrencyMismatchError, got %T", err)
        }
    })
}
```

## Anti-Patterns

### ❌ Ignoring Errors
```go
// DON'T: Ignore errors
data, _ := json.Marshal(user)
file.Write(data)
```

### ✅ Handle Every Error
```go
// DO: Handle errors explicitly
data, err := json.Marshal(user)
if err != nil {
    return fmt.Errorf("failed to marshal user: %w", err)
}
if _, err := file.Write(data); err != nil {
    return fmt.Errorf("failed to write file: %w", err)
}
```

---

### ❌ Naked Returns
```go
// DON'T: Naked returns with named results
func processPayment(id string) (payment *Payment, err error) {
    payment, err = repo.Find(id)
    if err != nil {
        return  // What does this return?
    }
    err = payment.Process()
    return  // Confusing
}
```

### ✅ Explicit Returns
```go
// DO: Explicit returns
func processPayment(id string) (*Payment, error) {
    payment, err := repo.Find(id)
    if err != nil {
        return nil, fmt.Errorf("find payment: %w", err)
    }
    if err := payment.Process(); err != nil {
        return nil, fmt.Errorf("process payment: %w", err)
    }
    return payment, nil
}
```

---

### ❌ Interface Pollution
```go
// DON'T: Define interfaces prematurely in producer
package service

type PaymentService interface {  // Producer-side interface
    Process(id string) error
    Refund(id string) error
    GetHistory(id string) ([]Event, error)
}
```

### ✅ Consumer-Defined Interfaces
```go
// DO: Define interfaces where they're used (consumer)
package handler

// PaymentProcessor is what this handler needs
type PaymentProcessor interface {
    Process(ctx context.Context, id string) error
}

type PaymentHandler struct {
    processor PaymentProcessor  // Small interface
}
```

---

### ❌ Context Misuse
```go
// DON'T: Store values that affect control flow
ctx = context.WithValue(ctx, "skip_validation", true)

// DON'T: Use string keys
ctx = context.WithValue(ctx, "userID", userID)
```

### ✅ Proper Context Usage
```go
// DO: Use typed keys
type contextKey int

const userIDKey contextKey = iota

func WithUserID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, userIDKey, id)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
    id, ok := ctx.Value(userIDKey).(string)
    return id, ok
}

// DO: Pass explicit parameters for control flow
func Process(ctx context.Context, skipValidation bool) error { ... }
```

---

### ❌ Panic in Library Code
```go
// DON'T: Panic in library code
func MustParse(s string) Time {
    t, err := Parse(s)
    if err != nil {
        panic(err)  // Crashes caller!
    }
    return t
}
```

### ✅ Return Errors
```go
// DO: Return errors, let caller decide
func Parse(s string) (Time, error) {
    // ...
    return time.Time{}, fmt.Errorf("invalid time format: %s", s)
}

// Must* functions only for initialization/tests
func MustParse(s string) Time {
    t, err := Parse(s)
    if err != nil {
        panic(fmt.Sprintf("MustParse: %v", err))
    }
    return t
}
```

## Go-Specific Rules

### Project Structure
```
myproject/
├── cmd/                   # Application entry points
│   └── api/
│       └── main.go
├── internal/              # Private packages
│   ├── domain/           # Domain logic
│   │   ├── payment.go
│   │   ├── money.go
│   │   └── errors.go
│   ├── application/      # Use cases
│   │   └── process_payment.go
│   └── infrastructure/   # External integrations
│       ├── postgres/
│       └── stripe/
├── pkg/                   # Public packages (if any)
├── api/                   # API definitions (OpenAPI, proto)
├── migrations/           # Database migrations
├── go.mod
└── go.sum
```

### Naming Conventions
```go
// Package names: short, lowercase, no underscores
package paymentservice  // DON'T
package payment         // DO

// Exported functions/types: PascalCase
func ProcessPayment() {}
type PaymentStatus string

// Unexported: camelCase
func validateAmount() {}
type paymentConfig struct {}

// Interfaces: -er suffix for single method
type Reader interface { Read(p []byte) (n int, err error) }
type PaymentProcessor interface { Process(ctx context.Context) error }

// Getters: no Get prefix
func (p *Payment) Status() PaymentStatus {}  // DO
func (p *Payment) GetStatus() PaymentStatus {}  // DON'T
```

### Error Wrapping
```go
// Wrap errors with context
if err != nil {
    return fmt.Errorf("process payment %s: %w", id, err)
}

// Check error types
if errors.Is(err, domain.ErrPaymentNotFound) { ... }

var stateErr *domain.InvalidStateError
if errors.As(err, &stateErr) { ... }
```

## Recommended Libraries

| Purpose | Library | Why |
|---------|---------|-----|
| HTTP router | chi / echo | Lightweight, stdlib compatible |
| Database | sqlx | Extends database/sql with scanning |
| Logging | zerolog / zap | Structured, performant |
| Config | envconfig / viper | Environment-based config |
| Validation | go-playground/validator | Struct validation |
| Testing mocks | gomock / mockery | Interface mocking |
| UUID | google/uuid | Standard UUID implementation |

## Testing Guidelines

### Table-Driven Tests
```go
func TestMoney_NewMoney(t *testing.T) {
    tests := []struct {
        name     string
        amount   int64
        currency Currency
        wantErr  error
    }{
        {
            name:     "valid GBP amount",
            amount:   100,
            currency: CurrencyGBP,
            wantErr:  nil,
        },
        {
            name:     "negative amount",
            amount:   -100,
            currency: CurrencyGBP,
            wantErr:  ErrNegativeAmount,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            _, err := NewMoney(tt.amount, tt.currency)
            if !errors.Is(err, tt.wantErr) {
                t.Errorf("NewMoney() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### What to Test
- Exported functions and methods
- Error conditions and edge cases
- Concurrent access (when applicable)
- Integration with real dependencies (separate test files)

### What NOT to Test
- Private functions (test through public API)
- Simple getters/setters
- Third-party library behavior
