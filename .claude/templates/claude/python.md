# Claude Development Guidelines - Python

## Core Principles

**These are non-negotiable. Every change must adhere to these principles.**

1. **TDD is mandatory** — Every line of production code must be written in response to a failing test
2. **Behavior over implementation** — Tests verify what code does, not how it does it
3. **Immutability by default** — Use `@dataclass(frozen=True)`, `NamedTuple`, and avoid mutation
4. **Explicit over implicit** — Clear code over clever code; no magic (except where Pythonic)
5. **Type hints everywhere** — Full type coverage with `mypy --strict` compliance

## Workflow

### Development Cycle: RED-GREEN-REFACTOR

Every feature follows this cycle:

1. **RED** — Write a failing test that describes the desired behavior
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Improve the code while keeping tests green

**Quality Gates:**

Before committing:
- [ ] All tests pass (`pytest`)
- [ ] Type checking passes (`mypy --strict`)
- [ ] Linting passes (`ruff check .`)
- [ ] Code is formatted (`ruff format .`)
- [ ] No `# type: ignore` without justification
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

### Entity Pattern (Dataclass)
```python
from dataclasses import dataclass, field, replace
from datetime import datetime
from typing import Self
from uuid import UUID, uuid4

@dataclass(frozen=True)
class PaymentId:
    value: UUID

    @classmethod
    def generate(cls) -> Self:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> Self:
        return cls(UUID(value))


class InvalidPaymentStateError(Exception):
    def __init__(self, current_state: str, action: str) -> None:
        super().__init__(f"Cannot {action} payment in state: {current_state}")


@dataclass
class Payment:
    id: PaymentId
    _status: str = field(default="pending", repr=False)
    amount: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    @classmethod
    def create(cls, amount: int) -> Self:
        return cls(
            id=PaymentId.generate(),
            _status="pending",
            amount=amount,
            created_at=datetime.now(),
        )

    def approve(self) -> Self:
        if self._status != "pending":
            raise InvalidPaymentStateError(self._status, "approve")
        return replace(self, _status="approved")

    @property
    def status(self) -> str:
        return self._status
```

### Value Object Pattern (Frozen Dataclass)
```python
from dataclasses import dataclass
from typing import Self


class InvalidAmountError(ValueError):
    pass


class CurrencyMismatchError(ValueError):
    pass


@dataclass(frozen=True)
class Money:
    amount: int  # In smallest unit (pence, cents)
    currency: str

    def __post_init__(self) -> None:
        if self.amount < 0:
            raise InvalidAmountError("Amount cannot be negative")
        if self.currency not in ("GBP", "USD", "EUR"):
            raise InvalidAmountError(f"Unsupported currency: {self.currency}")

    @classmethod
    def of(cls, amount: int, currency: str) -> Self:
        return cls(amount=amount, currency=currency)

    @classmethod
    def zero(cls, currency: str) -> Self:
        return cls(amount=0, currency=currency)

    def add(self, other: Self) -> Self:
        if self.currency != other.currency:
            raise CurrencyMismatchError(
                f"Cannot add {self.currency} and {other.currency}"
            )
        return Money(self.amount + other.amount, self.currency)

    def __str__(self) -> str:
        major = self.amount // 100
        minor = self.amount % 100
        symbols = {"GBP": "£", "USD": "$", "EUR": "€"}
        return f"{symbols.get(self.currency, '')}{major}.{minor:02d}"
```

### Port (Protocol/ABC) Pattern
```python
from abc import ABC, abstractmethod
from typing import Protocol, Sequence


# Option 1: Protocol (structural typing - preferred)
class PaymentRepository(Protocol):
    async def save(self, payment: Payment) -> None: ...
    async def find_by_id(self, id: PaymentId) -> Payment | None: ...
    async def find_by_status(self, status: str) -> Sequence[Payment]: ...


# Option 2: ABC (nominal typing - when you need shared implementation)
class PaymentRepositoryABC(ABC):
    @abstractmethod
    async def save(self, payment: Payment) -> None:
        raise NotImplementedError

    @abstractmethod
    async def find_by_id(self, id: PaymentId) -> Payment | None:
        raise NotImplementedError

    @abstractmethod
    async def find_by_status(self, status: str) -> Sequence[Payment]:
        raise NotImplementedError
```

### Adapter Implementation
```python
from typing import Sequence
import asyncpg


class PostgresPaymentRepository:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, payment: Payment) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO payments (id, status, amount, currency, created_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET status = $2
                """,
                str(payment.id.value),
                payment.status,
                payment.amount,
                payment.currency,
                payment.created_at,
            )

    async def find_by_id(self, id: PaymentId) -> Payment | None:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM payments WHERE id = $1",
                str(id.value),
            )
            return self._to_domain(row) if row else None

    def _to_domain(self, row: asyncpg.Record) -> Payment:
        return Payment(
            id=PaymentId.from_string(row["id"]),
            _status=row["status"],
            amount=row["amount"],
            created_at=row["created_at"],
        )
```

### Result Type Pattern
```python
from dataclasses import dataclass
from typing import Generic, TypeVar, Union

T = TypeVar("T")
E = TypeVar("E", bound=Exception)


@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T

    @property
    def ok(self) -> bool:
        return True


@dataclass(frozen=True)
class Err(Generic[E]):
    error: E

    @property
    def ok(self) -> bool:
        return False


Result = Union[Ok[T], Err[E]]


# Usage
def process_payment(payment: Payment) -> Result[Receipt, PaymentError]:
    if payment.amount > MAX_AMOUNT:
        return Err(AmountExceededError(payment.amount))
    return Ok(Receipt(payment_id=payment.id, timestamp=datetime.now()))


# Consumer
result = process_payment(payment)
if not result.ok:
    logger.error("Payment failed", error=result.error)
    return
receipt = result.value
```

### Use Case Pattern
```python
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ProcessPaymentInput:
    payment_id: str
    action: str


@dataclass(frozen=True)
class ProcessPaymentOutput:
    status: str
    receipt_id: str | None


class ProcessPaymentUseCase:
    def __init__(
        self,
        payment_repo: PaymentRepository,
        receipt_service: ReceiptService,
    ) -> None:
        self._payment_repo = payment_repo
        self._receipt_service = receipt_service

    async def execute(
        self, input: ProcessPaymentInput
    ) -> Result[ProcessPaymentOutput, PaymentError]:
        # 1. Fetch entity
        payment = await self._payment_repo.find_by_id(
            PaymentId.from_string(input.payment_id)
        )
        if payment is None:
            return Err(PaymentNotFoundError(input.payment_id))

        # 2. Execute domain logic
        try:
            updated_payment = payment.approve()
        except InvalidPaymentStateError as e:
            return Err(e)

        # 3. Persist changes
        await self._payment_repo.save(updated_payment)

        # 4. Return result
        receipt = await self._receipt_service.generate(updated_payment)
        return Ok(ProcessPaymentOutput(
            status=updated_payment.status,
            receipt_id=str(receipt.id) if receipt else None,
        ))
```

### Test Factory Pattern
```python
from datetime import datetime
from typing import Any


def create_payment(**overrides: Any) -> Payment:
    """Factory function for creating test Payment instances."""
    defaults = {
        "id": PaymentId.generate(),
        "_status": "pending",
        "amount": 1000,
        "created_at": datetime(2024, 1, 1, 12, 0, 0),
    }
    return Payment(**{**defaults, **overrides})


def create_money(**overrides: Any) -> Money:
    """Factory function for creating test Money instances."""
    defaults = {
        "amount": 1000,
        "currency": "GBP",
    }
    return Money(**{**defaults, **overrides})


# Usage in tests
def test_approve_rejects_non_pending_payment() -> None:
    payment = create_payment(_status="approved")

    with pytest.raises(InvalidPaymentStateError):
        payment.approve()
```

## Anti-Patterns

### ❌ Mutable Default Arguments
```python
# DON'T: Mutable default argument
def add_item(item: str, items: list[str] = []) -> list[str]:
    items.append(item)  # Shared across all calls!
    return items
```

### ✅ Use None and Create Fresh
```python
# DO: Use None sentinel
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    if items is None:
        items = []
    return [*items, item]  # Return new list
```

---

### ❌ Using `# type: ignore` Liberally
```python
# DON'T: Suppress type errors without understanding
result = some_function()  # type: ignore
data = response.json()  # type: ignore[union-attr]
```

### ✅ Fix Types Properly
```python
# DO: Use proper typing
from typing import TypedDict, cast

class ResponseData(TypedDict):
    id: str
    value: int

result: ResponseData = some_function()

# If truly necessary, document why
data = cast(ResponseData, response.json())  # External API, validated by schema
```

---

### ❌ Bare `except:`
```python
# DON'T: Catch all exceptions
try:
    process_payment()
except:
    logger.error("Something failed")
```

### ✅ Specific Exception Handling
```python
# DO: Catch specific exceptions
try:
    process_payment()
except PaymentValidationError as e:
    logger.warning("Validation failed", error=str(e))
    return Err(e)
except PaymentGatewayError as e:
    logger.error("Gateway error", error=str(e))
    raise  # Re-raise infrastructure errors
```

---

### ❌ God Classes
```python
# DON'T: Class doing too many things
class PaymentManager:
    def validate_payment(self): ...
    def calculate_tax(self): ...
    def process_payment(self): ...
    def send_notification(self): ...
    def generate_report(self): ...
    def export_to_csv(self): ...
```

### ✅ Single Responsibility
```python
# DO: Focused classes
class PaymentValidator:
    def validate(self, payment: Payment) -> ValidationResult: ...

class TaxCalculator:
    def calculate(self, payment: Payment) -> Money: ...

class PaymentProcessor:
    def process(self, payment: Payment) -> Receipt: ...

# Orchestration in use case
class ProcessPaymentUseCase:
    def __init__(
        self,
        validator: PaymentValidator,
        tax_calculator: TaxCalculator,
        processor: PaymentProcessor,
    ) -> None: ...
```

---

### ❌ Direct Mutation
```python
# DON'T: Mutate objects directly
class Order:
    def __init__(self) -> None:
        self.items: list[Item] = []
        self.status = "draft"

    def add_item(self, item: Item) -> None:
        self.items.append(item)  # Mutation

    def submit(self) -> None:
        self.status = "submitted"  # Mutation
```

### ✅ Immutable Updates
```python
# DO: Return new instances
@dataclass(frozen=True)
class Order:
    items: tuple[Item, ...]
    status: str

    def add_item(self, item: Item) -> Self:
        return replace(self, items=(*self.items, item))

    def submit(self) -> Self:
        if self.status != "draft":
            raise InvalidOrderStateError(self.status, "submit")
        return replace(self, status="submitted")
```

## Python-Specific Rules

### Type Hints
```python
# Modern Python 3.10+ syntax
def process(items: list[str]) -> dict[str, int]: ...

# Use | for union types
def find(id: str) -> User | None: ...

# Generic with TypeVar
from typing import TypeVar, Sequence

T = TypeVar("T")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None
```

### Async/Await Best Practices
```python
# Use async context managers
async with aiohttp.ClientSession() as session:
    async with session.get(url) as response:
        data = await response.json()

# Gather for concurrent operations
results = await asyncio.gather(
    fetch_user(user_id),
    fetch_orders(user_id),
    fetch_preferences(user_id),
)

# Use asyncio.TaskGroup (Python 3.11+)
async with asyncio.TaskGroup() as tg:
    task1 = tg.create_task(fetch_user(user_id))
    task2 = tg.create_task(fetch_orders(user_id))
# Both complete or both cancelled on error
```

### Configuration
```python
# Use pydantic-settings for config
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    api_key: str
    debug: bool = False

    model_config = {"env_prefix": "APP_"}


settings = Settings()  # Reads from environment
```

## Project Structure
```
src/
├── domain/                 # Business logic (no external deps)
│   ├── entities/          # Domain entities
│   ├── value_objects/     # Immutable value types
│   ├── services/          # Domain services
│   ├── ports/             # Protocol definitions
│   └── errors.py          # Domain-specific errors
├── application/           # Use case orchestration
│   ├── use_cases/         # Individual use cases
│   └── dtos.py            # Data transfer objects
├── infrastructure/        # External integrations
│   ├── repositories/      # Database implementations
│   ├── adapters/          # External API adapters
│   └── config.py          # Configuration
├── api/                   # HTTP API layer
│   ├── routes/            # Route handlers
│   ├── middleware/        # Auth, logging, etc.
│   └── schemas.py         # Request/response schemas
└── tests/
    ├── unit/              # Domain and application tests
    ├── integration/       # Infrastructure tests
    └── conftest.py        # Fixtures
```

## File Naming
```
snake_case.py           # All Python files
test_[name].py          # Test files
conftest.py             # Pytest fixtures
__init__.py             # Package markers
```

## Recommended Libraries

| Purpose | Library | Why |
|---------|---------|-----|
| Type checking | mypy | Industry standard, strict mode |
| Linting/formatting | ruff | Fast, replaces black+isort+flake8 |
| Testing | pytest + pytest-asyncio | De facto standard, async support |
| Validation | pydantic | Fast, type inference, validation |
| HTTP client | httpx | Modern async client |
| Database | asyncpg / sqlalchemy | Async support, type hints |
| DI | dependency-injector | Clean dependency injection |
