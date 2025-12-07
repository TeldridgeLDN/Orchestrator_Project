# Architecture Patterns Catalog

Quick reference for common architecture patterns with ASCII diagrams. Use these when creating architecture.md to help Claude understand the chosen pattern.

## Hexagonal Architecture (Ports & Adapters)

**When to use:** Multiple external integrations, need to swap implementations, domain-heavy applications.

```
                    ┌──────────────────────────┐
                    │      Driving Adapters    │
                    │  (HTTP, CLI, Events)     │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │     Driving Ports        │
                    │   (Use Case Interfaces)  │
                    └───────────┬──────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────┐
│                      DOMAIN CORE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Entities   │  │   Services  │  │ Value Objs  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└───────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │     Driven Ports         │
                    │  (Repository Interfaces) │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │     Driven Adapters      │
                    │  (DB, APIs, Queues)      │
                    └──────────────────────────┘
```

**Key Rules:**
- Domain has NO external dependencies
- All I/O goes through ports (interfaces)
- Adapters implement ports
- Dependencies point inward

**Example Port/Adapter:**
```typescript
// Port (in domain/)
interface PaymentGateway {
  charge(amount: Money, card: CardToken): Promise<ChargeResult>;
}

// Adapter (in infrastructure/)
class StripePaymentGateway implements PaymentGateway {
  async charge(amount: Money, card: CardToken): Promise<ChargeResult> {
    const result = await stripe.charges.create({...});
    return this.mapToChargeResult(result);
  }
}
```

---

## Clean Architecture

**When to use:** Complex business rules, long-lived systems, multiple delivery mechanisms.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRAMEWORKS & DRIVERS                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   Web   │  │   DB    │  │   UI    │  │ Devices │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
└───────┼────────────┼────────────┼────────────┼─────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INTERFACE ADAPTERS                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Controllers │  │  Gateways   │  │ Presenters  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│           ┌────────────────────────────────┐                   │
│           │         Use Cases              │                   │
│           └──────────────┬─────────────────┘                   │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Entities   │  │   Rules     │  │ Value Objs  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

**Key Rules:**
- Dependency Rule: dependencies only point inward
- Entities: enterprise-wide business rules
- Use Cases: application-specific business rules
- Interface Adapters: convert data between formats

---

## Layered Architecture

**When to use:** CRUD-heavy applications, simpler business logic, rapid development.

```
┌─────────────────────────────────────────┐
│           PRESENTATION LAYER            │
│  Controllers, Views, API Endpoints      │
└──────────────────┬──────────────────────┘
                   │ calls
                   ▼
┌─────────────────────────────────────────┐
│           APPLICATION LAYER             │
│  Services, DTOs, Orchestration          │
└──────────────────┬──────────────────────┘
                   │ uses
                   ▼
┌─────────────────────────────────────────┐
│            DOMAIN LAYER                 │
│  Entities, Business Rules, Interfaces   │
└──────────────────┬──────────────────────┘
                   │ persists via
                   ▼
┌─────────────────────────────────────────┐
│         INFRASTRUCTURE LAYER            │
│  Repositories, External Services, DB    │
└─────────────────────────────────────────┘
```

**Key Rules:**
- Each layer only depends on layers below
- Domain layer is pure (no framework dependencies)
- Infrastructure implements domain interfaces

---

## CQRS (Command Query Responsibility Segregation)

**When to use:** Different read/write patterns, complex queries, event sourcing.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
         Commands │                           │ Queries
                  ▼                           ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    COMMAND HANDLERS     │     │     QUERY HANDLERS      │
│  (Write Operations)     │     │    (Read Operations)    │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    WRITE MODEL          │     │      READ MODEL         │
│  (Normalized, Domain)   │────▶│  (Denormalized, Views)  │
│                         │sync │                         │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    WRITE DATABASE       │     │    READ DATABASE        │
│  (PostgreSQL, etc.)     │     │  (Redis, Elasticsearch) │
└─────────────────────────┘     └─────────────────────────┘
```

**Key Rules:**
- Commands mutate state, return nothing (or success/failure)
- Queries return data, never mutate
- Separate models optimized for each purpose
- Sync mechanism keeps read model updated

---

## Event-Driven Architecture

**When to use:** Decoupled services, async workflows, audit trails, scalability.

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Service A   │     │   Service B   │     │   Service C   │
│  (Producer)   │     │  (Consumer)   │     │  (Consumer)   │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        │ publish             │ subscribe           │ subscribe
        │                     │                     │
        ▼                     │                     │
┌───────────────────────────────────────────────────────────────┐
│                        EVENT BUS                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  OrderCreated │ PaymentReceived │ ShipmentDispatched   │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │  Queue  │     │  Queue  │     │  Queue  │
        │  (B)    │     │  (C)    │     │  (Audit)│
        └─────────┘     └─────────┘     └─────────┘
```

**Event Structure:**
```typescript
type DomainEvent = {
  readonly id: string;           // Unique event ID
  readonly type: string;         // Event type name
  readonly aggregateId: string;  // Entity this relates to
  readonly timestamp: Date;      // When event occurred
  readonly version: number;      // For ordering
  readonly payload: unknown;     // Event-specific data
};
```

---

## Microservices

**When to use:** Large teams, independent deployment needs, different scaling requirements.

```
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                              │
│              (Routing, Auth, Rate Limiting)                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Orders     │     │   Payments    │     │   Shipping    │
│   Service     │────▶│   Service     │────▶│   Service     │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        ▼                     ▼                     ▼
    ┌───────┐             ┌───────┐             ┌───────┐
    │  DB   │             │  DB   │             │  DB   │
    └───────┘             └───────┘             └───────┘
```

**Key Rules:**
- Each service owns its data (no shared databases)
- Services communicate via APIs or events
- Each service can be deployed independently
- Services are organized around business capabilities

---

## Modular Monolith

**When to use:** Starting point before microservices, clear boundaries needed, simpler deployment.

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONOLITH APPLICATION                        │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Orders Module  │  │ Payments Module │  │ Shipping Module │ │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │ │
│  │  │  Domain   │  │  │  │  Domain   │  │  │  │  Domain   │  │ │
│  │  ├───────────┤  │  │  ├───────────┤  │  │  ├───────────┤  │ │
│  │  │Application│  │  │  │Application│  │  │  │Application│  │ │
│  │  ├───────────┤  │  │  ├───────────┤  │  │  ├───────────┤  │ │
│  │  │  Infra    │  │  │  │  Infra    │  │  │  │  Infra    │  │ │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┼────────────────────┘          │
│                                │                               │
│                    ┌───────────▼───────────┐                   │
│                    │   Module Interfaces   │                   │
│                    │  (Public APIs only)   │                   │
│                    └───────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Shared Database    │
                    │  (Separate schemas)   │
                    └───────────────────────┘
```

**Key Rules:**
- Modules have clear boundaries (like services)
- Modules communicate through defined interfaces
- Each module could become a service later
- Shared infrastructure but separate schemas

---

## Choosing a Pattern

| Pattern | Best For | Trade-offs |
|---------|----------|------------|
| **Hexagonal** | Multiple integrations, testability | More boilerplate |
| **Clean** | Complex business rules, longevity | Learning curve |
| **Layered** | CRUD apps, rapid development | Can become tangled |
| **CQRS** | Different read/write needs | Complexity, eventual consistency |
| **Event-Driven** | Decoupling, audit trails | Debugging difficulty |
| **Microservices** | Large teams, scaling | Operational complexity |
| **Modular Monolith** | Starting point, clear boundaries | Discipline required |
