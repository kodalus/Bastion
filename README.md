# Bastion

**Home preparedness management system** — a full-stack web application for tracking emergency supplies, maintenance schedules, and household readiness.

> A learning project: 13 years of desktop/WPF development, first web stack — ASP.NET Core, Angular, PostgreSQL, Docker. The domain analogy is real: supply rotation by expiry date follows the same pattern as planned equipment maintenance in industrial CMMS systems.

---

## Features

- **Readiness index (0–100%)** — weighted score across all supply categories + equipment maintenance, updated on every dashboard load
- **Gap analysis + shopping list** — what's missing vs. targets with priority, estimated cost per item, and total budget to reach 100%
- **Supply catalog** — reference list of 39 recommended items (water, food, medical, hygiene, energy, tools, documents) with suggested quantities per 4-person household; one-click bulk import to inventory with per-row location and price; deduplicates on re-import
- **Equipment catalog** — recommended emergency gear (fire extinguisher, generator, radio, filters, tools…); tracks what you own vs. what's missing; equipment coverage score card on the dashboard
- **Catalog parent linking** — each inventory item can be linked to its canonical catalog entry (e.g. "Makaron penne" → parent "Makaron"); auto-suggested on save via fuzzy name matching; enables correct suggested-quantity display and deduplication in the buy list
- **Supply inventory** — CRUD with categories, storage locations, expiry dates (FIFO logic), estimated price per unit, suggested quantity from catalog, below-target highlight
- **Target levels** — per-category norms, fully editable. Defaults: 72-hour EU minimum as the critical floor, 14-day horizon as the recommended target. Water: 3 L/person/day (2 L drinking per Polish RCB guideline + 1 L hygiene)
- **Equipment + maintenance** — recurring tasks with interval tracking, overdue/due-soon detection, contribution to readiness score
- **Emergency checklists** — scenario-based (power outage, evacuation, water shortage), interactive tick-off with reset
- **Price tracking** — prices entered in the supply or equipment catalog persist in Dexie (IndexedDB); inventory and dashboard fall back to these when no per-item price is stored. Prices survive page reloads and tab switches on the same device/browser
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
- API + Swagger → http://localhost:8090/swagger
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
│   ├── Bastion.Domain.Tests           # 42 unit tests (ReadinessScore, supply/equipment logic)
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
                                       └── CatalogItemName? ──> [Dexie supplyCatalog / PostgreSQL SupplyCatalog]
```

`SupplyItem.CatalogItemName` is an optional reference to the canonical catalog entry (e.g. `"Makaron"`). It enables:
- **Exact suggested-quantity lookup** — no fuzzy matching needed when the link is set
- **Dashboard deduplication** — a supply linked to a catalog entry suppresses that entry from the "missing" list
- **Auto-suggest on save** — the form dialog uses fuzzy keyword matching (`findCatalogMatch`) to pre-fill the field when the item name is close enough

The supply catalog (39 items) and equipment catalog (23 items) are seeded into PostgreSQL on first start and mirrored into Dexie (`supplyCatalog` / `equipmentCatalog` tables) at app init. Prices are persisted per item in Dexie so they survive page reloads without a backend round-trip. The static TypeScript files (`frontend/src/app/core/data/`) are kept as offline seed fallback and for fuzzy name matching (`findCatalogMatch`) used by the inventory form.

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

- **No production secrets in the repository.** `appsettings.Development.json` is committed and contains credentials for the local Docker container only (`bastion_dev`). Production connection strings, JWT keys, and SMTP credentials must be supplied via environment variables — never committed.
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

## Known limitations

- **No authentication** — v1 is single-household, no login, no multi-tenancy. Auth is a planned future phase; the API is not safe to expose publicly.
- **Backend not deployed** — the app runs locally via `docker compose up`. The Angular frontend is hosted on Vercel (offline-first, no backend required for the dashboard), but API-dependent pages (inventory CRUD, equipment) need the backend running.

---

## Project background

This project exists on two levels:

1. **A real tool** I use for my own household (4 people). Target levels are drawn from several sources: the EU 72-hour minimum, the Polish RCB 7-day guideline (2 L/person/day drinking water), and a 14-day extended horizon from rural-preparedness recommendations. The 3 L/day water default adds 1 L for hygiene on top of the RCB drinking norm — a deliberate choice, not a quoted figure.
2. **A learning project**: 13 years of WPF/desktop development, first web stack.

The domain analogy is deliberate: rotating supplies by expiry date is the same pattern as scheduled equipment maintenance. Bastion makes this explicit in the domain model.
