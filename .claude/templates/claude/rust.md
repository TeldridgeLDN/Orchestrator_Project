# Claude Development Guidelines - Rust

## Core Principles

**These are non-negotiable. Every change must adhere to these principles.**

1. **TDD is mandatory** — Every line of production code must be written in response to a failing test
2. **Behavior over implementation** — Tests verify what code does, not how it does it
3. **Ownership and borrowing** — Leverage Rust's ownership system; avoid unnecessary clones
4. **Explicit error handling** — Use `Result<T, E>` for fallible operations; no panics in library code
5. **Type safety first** — Leverage the type system to make invalid states unrepresentable

## Workflow

### Development Cycle: RED-GREEN-REFACTOR

Every feature follows this cycle:

1. **RED** — Write a failing test that describes the desired behavior
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Improve the code while keeping tests green

**Quality Gates:**

Before committing:
- [ ] All tests pass (`cargo test`)
- [ ] No compiler warnings (`cargo build`)
- [ ] Clippy passes (`cargo clippy -- -D warnings`)
- [ ] Code is formatted (`cargo fmt`)
- [ ] No `unwrap()` in library code (use `?` or `expect()` with context)
- [ ] Documentation for public API (`cargo doc`)

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
```rust
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct PaymentId(Uuid);

impl PaymentId {
    pub fn generate() -> Self {
        Self(Uuid::new_v4())
    }

    pub fn from_string(s: &str) -> Result<Self, PaymentError> {
        Ok(Self(Uuid::parse_str(s).map_err(|_| PaymentError::InvalidId)?))
    }

    pub fn as_str(&self) -> String {
        self.0.to_string()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Approved,
    Rejected,
    Settled,
}

#[derive(Debug, Clone)]
pub struct Payment {
    id: PaymentId,
    status: PaymentStatus,
    amount: Money,
    created_at: DateTime<Utc>,
}

impl Payment {
    pub fn create(amount: Money) -> Self {
        Self {
            id: PaymentId::generate(),
            status: PaymentStatus::Pending,
            amount,
            created_at: Utc::now(),
        }
    }

    pub fn approve(&mut self) -> Result<(), PaymentError> {
        if self.status != PaymentStatus::Pending {
            return Err(PaymentError::InvalidStateTransition {
                from: self.status.clone(),
                action: "approve".to_string(),
            });
        }
        self.status = PaymentStatus::Approved;
        Ok(())
    }

    pub fn id(&self) -> &PaymentId {
        &self.id
    }

    pub fn status(&self) -> &PaymentStatus {
        &self.status
    }

    pub fn amount(&self) -> &Money {
        &self.amount
    }
}
```

### Value Object Pattern
```rust
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    GBP,
    USD,
    EUR,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    /// Amount in smallest unit (pence, cents)
    amount: i64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: i64, currency: Currency) -> Result<Self, MoneyError> {
        if amount < 0 {
            return Err(MoneyError::NegativeAmount);
        }
        Ok(Self { amount, currency })
    }

    pub fn zero(currency: Currency) -> Self {
        Self { amount: 0, currency }
    }

    pub fn add(&self, other: &Self) -> Result<Self, MoneyError> {
        if self.currency != other.currency {
            return Err(MoneyError::CurrencyMismatch {
                left: self.currency,
                right: other.currency,
            });
        }
        Ok(Self {
            amount: self.amount + other.amount,
            currency: self.currency,
        })
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let symbol = match self.currency {
            Currency::GBP => "£",
            Currency::USD => "$",
            Currency::EUR => "€",
        };
        let major = self.amount / 100;
        let minor = self.amount % 100;
        write!(f, "{}{}.{:02}", symbol, major, minor)
    }
}
```

### Port (Trait) Pattern
```rust
use async_trait::async_trait;

#[async_trait]
pub trait PaymentRepository: Send + Sync {
    async fn save(&self, payment: &Payment) -> Result<(), RepositoryError>;
    async fn find_by_id(&self, id: &PaymentId) -> Result<Option<Payment>, RepositoryError>;
    async fn find_by_status(&self, status: &PaymentStatus) -> Result<Vec<Payment>, RepositoryError>;
    async fn delete(&self, id: &PaymentId) -> Result<(), RepositoryError>;
}

// Mock implementation for testing
#[cfg(test)]
pub struct MockPaymentRepository {
    payments: std::sync::Mutex<std::collections::HashMap<String, Payment>>,
}

#[cfg(test)]
#[async_trait]
impl PaymentRepository for MockPaymentRepository {
    async fn save(&self, payment: &Payment) -> Result<(), RepositoryError> {
        let mut payments = self.payments.lock().unwrap();
        payments.insert(payment.id().as_str(), payment.clone());
        Ok(())
    }

    async fn find_by_id(&self, id: &PaymentId) -> Result<Option<Payment>, RepositoryError> {
        let payments = self.payments.lock().unwrap();
        Ok(payments.get(&id.as_str()).cloned())
    }

    // ... other implementations
}
```

### Adapter Implementation
```rust
use sqlx::{PgPool, Row};

pub struct PostgresPaymentRepository {
    pool: PgPool,
}

impl PostgresPaymentRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PaymentRepository for PostgresPaymentRepository {
    async fn save(&self, payment: &Payment) -> Result<(), RepositoryError> {
        sqlx::query(
            r#"
            INSERT INTO payments (id, status, amount, currency, created_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET status = $2
            "#,
        )
        .bind(payment.id().as_str())
        .bind(format!("{:?}", payment.status()))
        .bind(payment.amount().amount())
        .bind(format!("{:?}", payment.amount().currency()))
        .bind(payment.created_at)
        .execute(&self.pool)
        .await
        .map_err(|e| RepositoryError::Database(e.to_string()))?;

        Ok(())
    }

    async fn find_by_id(&self, id: &PaymentId) -> Result<Option<Payment>, RepositoryError> {
        let row = sqlx::query("SELECT * FROM payments WHERE id = $1")
            .bind(id.as_str())
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| RepositoryError::Database(e.to_string()))?;

        match row {
            Some(row) => Ok(Some(self.row_to_payment(row)?)),
            None => Ok(None),
        }
    }
}
```

### Error Handling Pattern
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PaymentError {
    #[error("Invalid payment ID")]
    InvalidId,

    #[error("Cannot {action} payment in state {from:?}")]
    InvalidStateTransition {
        from: PaymentStatus,
        action: String,
    },

    #[error("Payment not found: {0}")]
    NotFound(String),

    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),

    #[error("Validation error: {0}")]
    Validation(String),
}

#[derive(Error, Debug)]
pub enum MoneyError {
    #[error("Amount cannot be negative")]
    NegativeAmount,

    #[error("Currency mismatch: cannot combine {left:?} and {right:?}")]
    CurrencyMismatch {
        left: Currency,
        right: Currency,
    },
}

#[derive(Error, Debug)]
pub enum RepositoryError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Connection error: {0}")]
    Connection(String),
}
```

### Use Case Pattern
```rust
pub struct ProcessPaymentInput {
    pub payment_id: String,
}

pub struct ProcessPaymentOutput {
    pub status: String,
    pub receipt_id: Option<String>,
}

pub struct ProcessPaymentUseCase<R: PaymentRepository> {
    payment_repo: R,
}

impl<R: PaymentRepository> ProcessPaymentUseCase<R> {
    pub fn new(payment_repo: R) -> Self {
        Self { payment_repo }
    }

    pub async fn execute(
        &self,
        input: ProcessPaymentInput,
    ) -> Result<ProcessPaymentOutput, PaymentError> {
        // 1. Parse and validate input
        let payment_id = PaymentId::from_string(&input.payment_id)?;

        // 2. Fetch entity
        let mut payment = self
            .payment_repo
            .find_by_id(&payment_id)
            .await?
            .ok_or_else(|| PaymentError::NotFound(input.payment_id.clone()))?;

        // 3. Execute domain logic
        payment.approve()?;

        // 4. Persist changes
        self.payment_repo.save(&payment).await?;

        // 5. Return result
        Ok(ProcessPaymentOutput {
            status: format!("{:?}", payment.status()),
            receipt_id: None, // Would generate receipt
        })
    }
}
```

### Test Pattern
```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Test factory
    fn create_payment(status: PaymentStatus) -> Payment {
        Payment {
            id: PaymentId::generate(),
            status,
            amount: Money::new(1000, Currency::GBP).unwrap(),
            created_at: Utc::now(),
        }
    }

    fn create_money(amount: i64, currency: Currency) -> Money {
        Money::new(amount, currency).unwrap()
    }

    #[test]
    fn approve_succeeds_for_pending_payment() {
        let mut payment = create_payment(PaymentStatus::Pending);

        let result = payment.approve();

        assert!(result.is_ok());
        assert_eq!(payment.status(), &PaymentStatus::Approved);
    }

    #[test]
    fn approve_fails_for_already_approved_payment() {
        let mut payment = create_payment(PaymentStatus::Approved);

        let result = payment.approve();

        assert!(matches!(
            result,
            Err(PaymentError::InvalidStateTransition { .. })
        ));
    }

    #[test]
    fn money_add_succeeds_for_same_currency() {
        let a = create_money(100, Currency::GBP);
        let b = create_money(200, Currency::GBP);

        let result = a.add(&b).unwrap();

        assert_eq!(result.amount(), 300);
        assert_eq!(result.currency(), Currency::GBP);
    }

    #[test]
    fn money_add_fails_for_different_currencies() {
        let a = create_money(100, Currency::GBP);
        let b = create_money(200, Currency::USD);

        let result = a.add(&b);

        assert!(matches!(result, Err(MoneyError::CurrencyMismatch { .. })));
    }
}
```

## Anti-Patterns

### ❌ Using `unwrap()` in Library Code
```rust
// DON'T: Panic on errors
fn parse_amount(s: &str) -> i64 {
    s.parse().unwrap()  // Panics on invalid input!
}
```

### ✅ Proper Error Handling
```rust
// DO: Return Result with descriptive error
fn parse_amount(s: &str) -> Result<i64, ParseError> {
    s.parse().map_err(|_| ParseError::InvalidAmount(s.to_string()))
}

// Use expect() only when panic is appropriate (e.g., programmer error)
fn init_config() -> Config {
    Config::load().expect("Config file must exist at startup")
}
```

---

### ❌ Cloning Everything
```rust
// DON'T: Clone when borrowing would work
fn process_items(items: Vec<Item>) -> Vec<Item> {
    let cloned = items.clone();  // Unnecessary clone
    cloned.into_iter().filter(|i| i.is_valid()).collect()
}
```

### ✅ Use References When Possible
```rust
// DO: Take reference, clone only when needed
fn process_items(items: &[Item]) -> Vec<&Item> {
    items.iter().filter(|i| i.is_valid()).collect()
}

// Or take ownership if caller doesn't need it
fn process_items_owned(items: Vec<Item>) -> Vec<Item> {
    items.into_iter().filter(|i| i.is_valid()).collect()
}
```

---

### ❌ String Everywhere
```rust
// DON'T: Stringly typed code
fn process_payment(status: String, currency: String) {
    if status == "pending" { ... }  // Easy to typo
    if currency == "gbp" { ... }    // Case sensitivity issues
}
```

### ✅ Use Enums for Fixed Sets
```rust
// DO: Type-safe enums
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    GBP,
    USD,
    EUR,
}

fn process_payment(status: PaymentStatus, currency: Currency) {
    match status {
        PaymentStatus::Pending => { ... }
        // Compiler ensures all cases handled
    }
}
```

---

### ❌ Mutex Without Proper Scoping
```rust
// DON'T: Hold lock across await
async fn update_value(shared: &Mutex<Value>) {
    let mut guard = shared.lock().unwrap();
    do_async_work().await;  // Lock held across await!
    guard.update();
}
```

### ✅ Minimize Lock Scope
```rust
// DO: Drop lock before await
async fn update_value(shared: &Mutex<Value>) {
    let current = {
        let guard = shared.lock().unwrap();
        guard.clone()  // Clone and release lock
    };

    let updated = do_async_work(current).await;

    let mut guard = shared.lock().unwrap();
    *guard = updated;
}

// Or use tokio::sync::Mutex for async
async fn update_value(shared: &tokio::sync::Mutex<Value>) {
    let mut guard = shared.lock().await;
    do_async_work(&mut guard).await;
}
```

## Rust-Specific Rules

### Module Organization
```rust
// lib.rs or main.rs
mod domain;
mod application;
mod infrastructure;
mod api;

// Re-export public API
pub use domain::entities::*;
pub use domain::value_objects::*;
pub use application::use_cases::*;
```

### Cargo.toml Dependencies
```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
thiserror = "1"
serde = { version = "1", features = ["derive"] }
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
tokio-test = "0.4"
mockall = "0.11"  # For mock generation
```

### Documentation
```rust
/// Process a payment and return a receipt.
///
/// # Arguments
///
/// * `payment` - The payment to process
///
/// # Returns
///
/// * `Ok(Receipt)` - Processing succeeded
/// * `Err(PaymentError)` - Processing failed
///
/// # Examples
///
/// ```
/// let payment = Payment::create(Money::new(1000, Currency::GBP)?);
/// let receipt = process_payment(&payment)?;
/// ```
pub fn process_payment(payment: &Payment) -> Result<Receipt, PaymentError> {
    // ...
}
```

## Project Structure
```
src/
├── lib.rs                 # Library root
├── domain/
│   ├── mod.rs
│   ├── entities/          # Domain entities
│   │   ├── mod.rs
│   │   └── payment.rs
│   ├── value_objects/     # Value objects
│   │   ├── mod.rs
│   │   └── money.rs
│   ├── ports/             # Trait definitions
│   │   ├── mod.rs
│   │   └── payment_repository.rs
│   └── errors.rs          # Domain errors
├── application/
│   ├── mod.rs
│   └── use_cases/         # Use cases
│       ├── mod.rs
│       └── process_payment.rs
├── infrastructure/
│   ├── mod.rs
│   └── repositories/      # Repository implementations
│       ├── mod.rs
│       └── postgres_payment.rs
└── api/                   # HTTP handlers
    ├── mod.rs
    └── routes/

tests/
├── integration/           # Integration tests
└── common/               # Shared test utilities
    └── mod.rs
```

## Recommended Crates

| Purpose | Crate | Why |
|---------|-------|-----|
| Async runtime | tokio | Industry standard |
| Error handling | thiserror | Derive Error trait |
| Serialization | serde | De facto standard |
| HTTP server | axum | Async, type-safe |
| Database | sqlx | Async, compile-time checked |
| Logging | tracing | Structured logging |
| CLI | clap | Derive-based argument parsing |
| Mocking | mockall | Automatic mock generation |
