# Bastion

**Home preparedness management system** — a full-stack web application for tracking emergency supplies, maintenance schedules, and household readiness.

> Built as a portfolio project demonstrating senior .NET + Angular skills. Domain expertise drawn from 13 years building industrial CMMS/MES/APS systems: supply rotation by expiry date follows the same pattern as planned equipment maintenance.

---

## Screenshots

| Dashboard | Inventory | Supply Catalog | Equipment Catalog |
|-----------|-----------|--------------|-----------------|
| Readiness index, gap analysis, buy list with costs | Supply list, suggested qty, below-target highlight | 39 items with import, prices, per-row location | Recommended gear, have/missing, coverage score |

> **Live demo:** run with `docker compose up` (see below) — seeds a realistic 4-person household.

---

## Features

- **Readiness index (0–100%)** — weighted score across all supply categories + equipment maintenance, updated on every dashboard load
- **Gap analysis + shopping list** — what's missing vs. targets with priority, estimated cost per item, and total budget to reach 100%
- **Supply catalog** — reference list of 39 recommended items (water, food, medical, hygiene, energy, tools, documents) with suggested quantities per 4-person household; one-click bulk import to inventory with per-row location and price; deduplicates on re-import
- **Equipment catalog** — recommended emergency gear (fire extinguisher, generator, radio, filters, tools…); tracks what you own vs. what's missing; equipment coverage score card on the dashboard
- **Catalog parent linking** — each inventory item can be linked to its canonical catalog entry (e.g. "Makaron penne" → parent "Makaron"); auto-suggested on save via fuzzy name matching; enables correct suggested-quantity display and deduplication in the buy list
- **Supply inventory** — CRUD with categories, storage locations, expiry dates (FIFO logic), estimated price per unit, suggested quantity from catalog, below-target highlight
- **Target levels** — per-category norms (water: 3 L/person/day × 14 days etc.), seeded from civil-defense guidelines, fully editable
- **Equipment + maintenance** — recurring tasks with interval tracking, overdue/due-soon detection, contribution to readiness score
- **Emergency checklists** — scenario-based (power outage, evacuation, water shortage), interactive tick-off with reset
- **Price tracking** — prices entered in the supply or equipment catalog persist in `localStorage`; inventory and dashboard fall back to these when no per-item price is stored
- **Email notifications** — daily digest of expiring supplies and overdue maintenance via MailHog (dev) or any SMTP

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | ASP.NET Core 8 Minimal API, C# 12 |
| Architecture | Clean Architecture + DDD-light |
| Database | EF Core 8 + PostgreSQL |
| Background jobs | Quartz.NET (cron-scheduled daily jobs) |
| Email | MailKit + MailHog (dev SMTP sink) |
| Frontend | Angular 17+, standalone components, signals |
| UI components | Angular Material |
| Containers | Docker + docker-compose |
| CI | GitHub Actions |
| Tests | xUnit + Testcontainers (integration), domain unit tests |

---

## Quick start

### One command

```bash
docker compose up
```

Opens:
- Frontend → http://localhost:4200
- API + Swagger → http://localhost:5137/swagger
- MailHog web UI → http://localhost:8025

Database migrations and seed data run automatically on first start.

### Local development

**Prerequisites:** .NET 8 SDK, Node 18+, PostgreSQL running (or use the docker-compose `postgres` service)

```bash
# Backend
cd src/Bastion.Api
dotnet run

# Frontend (separate terminal)
cd frontend
npm install
ng serve
```

Connection strings and email config go in `src/Bastion.Api/appsettings.Development.json` (already configured for local dev).

---

## Architecture

```
Bastion.sln
├── src/
│   ├── Bastion.Domain          # Entities, value objects, ReadinessScore (pure function)
│   ├── Bastion.Application     # Use cases, repository interfaces, DTOs
│   ├── Bastion.Infrastructure  # EF Core, migrations, Quartz jobs, MailKit
│   └── Bastion.Api             # Minimal API endpoints, DI wiring, seeder
├── frontend/                   # Angular 17 standalone app
├── tests/
│   ├── Bastion.Domain.Tests           # 28 unit tests (ReadinessScore, supply/equipment logic)
│   ├── Bastion.Application.Tests
│   └── Bastion.Api.IntegrationTests   # Testcontainers — real PostgreSQL per test run
└── docker-compose.yml
```

**Key design decisions:**

- `ReadinessScore` is a pure, stateless function in the domain layer — no I/O, fully unit-tested. Score = weighted average across supply categories (water and food weighted higher) + equipment score (fraction of on-time maintenance tasks).
- Domain entities use factory methods (`Equipment.Create(...)`) and expose state only through deliberate operations (`task.Complete(date)`), not public setters.
- Quartz.NET jobs decouple notification creation from dispatch: `ExpiryScanJob` + `MaintenanceDueJob` write `Notification` records; `NotificationDispatchJob` sends them. Deduplication via `ExistsForDateAsync` prevents duplicate digests.

---

## Domain model

```
Household ──< Member
     │
     ├──< TargetLevel (per category: Water/Food/Medical/Hygiene/Energy/Tools/Documents)
     ├──< Equipment ──< MaintenanceTask
     ├──< Scenario ──< ChecklistItem
     └── (via StorageLocation) ──< SupplyItem
                                       │
                                       └── CatalogItemName? ──> [static catalog]
```

`SupplyItem.CatalogItemName` is an optional reference to the canonical catalog entry (e.g. `"Makaron"`). It enables:
- **Exact suggested-quantity lookup** — no fuzzy matching needed when the link is set
- **Dashboard deduplication** — a supply linked to a catalog entry suppresses that entry from the "missing" list
- **Auto-suggest on save** — the form dialog uses fuzzy keyword matching (`findCatalogMatch`) to pre-fill the field when the item name is close enough

The static supply catalog (`SUPPLY_CATALOG` — 39 items) and equipment catalog live in the Angular frontend as typed constants (`frontend/src/app/core/data/`). Prices are persisted per item in `localStorage` so they survive page reloads without a backend round-trip.

Supplies track `ExpiryDate`; expired items are excluded from the readiness calculation, expiring-soon items get a reduced weight. This mirrors CMMS planned-maintenance logic where overdue tasks degrade the equipment score.

---

## Running tests

```bash
# Unit tests (no infrastructure needed)
dotnet test tests/Bastion.Domain.Tests

# Integration tests (requires Docker for Testcontainers)
dotnet test tests/Bastion.Api.IntegrationTests
```

CI runs all tests on every push — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Security considerations

- **No secrets in the repository.** Connection strings, JWT keys, and SMTP credentials are in `appsettings.Development.json` (git-ignored for local overrides) or environment variables. `.env.example` provides a template.
- **EF Core only** — no raw SQL; parameterized queries by default throughout.
- **Input validation** at the API boundary; `ProblemDetails` responses; no stack traces leaked to clients.
- **Dependabot** enabled; CI fails on `dotnet list package --vulnerable`.
- HTTPS redirect and security headers configured in `Program.cs`.
- v1 uses a single-household model (no multi-tenancy); auth is scoped for a future phase.

---

## Background jobs

| Job | Schedule | What it does |
|-----|----------|-------------|
| `ExpiryScanJob` | 06:00 daily | Finds supplies expiring within 30 days → creates `Notification` record |
| `MaintenanceDueJob` | 06:05 daily | Finds overdue / due-soon maintenance tasks → creates `Notification` |
| `NotificationDispatchJob` | 06:30 daily | Sends pending notifications via SMTP, marks `SentAt` |

Trigger manually in dev:

```bash
curl -X POST http://localhost:5137/api/dev/trigger-scan
curl -X POST http://localhost:5137/api/dev/trigger-dispatch
```

MailHog captures outbound email at http://localhost:8025.

---

## Project background

This project exists on two levels:

1. **A real tool** I use for my own household (4 people). The seed data reflects genuine civil-defense norms (3 L water/person/day, 2100–2500 kcal food/person/day).
2. **A portfolio piece** showing that a developer with 13 years of WPF/desktop and industrial system experience (CMMS, MES, APS) can build and ship a modern web product with clean architecture, CI, Docker, and tests.

The domain analogy is deliberate: rotating supplies by expiry date is the same pattern as scheduled equipment maintenance. Bastion makes this explicit in the domain model.
