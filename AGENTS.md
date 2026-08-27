# AGENTS.md — Sistema de tickets de mantenimiento

## Purpose

This repository contains the MVP for the Hackaton LuxNova INACAP 2026 challenge: a corrective-maintenance ticketing system for machinery.

The project is an Nx monorepo with an Angular frontend (`apps/web`) and a NestJS API (`apps/api`). PostgreSQL is the required persistence layer.

These instructions apply to the entire repository unless a more specific `AGENTS.md` exists in a subdirectory.

## Core principles

- Inspect the relevant code and documentation before making changes.
- Keep changes focused on the requested outcome and current authorized phase.
- Preserve existing user changes and repository conventions.
- Do not add unrelated refactors, dependencies, abstractions, screens, endpoints, or features.
- Prefer simple, typed, maintainable implementations suitable for a reliable five-minute demo.
- Do not treat examples, TODOs, optional features, or pending decisions as approved requirements.
- If a required decision is missing or contradictory, stop at the reversible boundary and report it instead of guessing.
- Backend business rules are authoritative; frontend visibility is UX, not security.

## Sources of truth

Use this precedence when product behavior conflicts:

1. Latest explicit decision approved by the user/team.
2. `Especificacion_Funcional_Sistema_Tickets_Mantenimiento.docx` or its repository-maintained equivalent.
3. The functional documentation under `docs/`, starting with `docs/README.md`.
4. Official `DesafioHackaton.pdf`.
5. Existing code and tests, only as implementation evidence.
6. Mockups, prototypes, TODOs, examples, and assumptions.

A later approved decision replaces conflicting earlier material. Record unresolved conflicts or necessary decisions in `docs/PENDING_DECISIONS.md`; do not silently choose an interpretation.

Use `RN-01` to `RN-21` and `CA-01` to `CA-14` when reporting affected behavior. Consult the focused document instead of duplicating its full content:

- `docs/BUSINESS_RULES.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- `docs/TICKET_LIFECYCLE.md`
- `docs/ROLES_AND_PERMISSIONS.md`
- `docs/PRIORITY_RULES.md`
- `docs/TECHNICIAN_ASSIGNMENT.md`
- `docs/FREEZE_WORKFLOW.md`
- `docs/MVP_SCOPE.md`

## Product boundaries

The MVP is for corrective maintenance of machinery only.

Required capabilities:

- authentication and role-based access;
- ticket creation, reading, listing, detail, and permitted updates;
- PostgreSQL persistence;
- role-based ticket visibility;
- technician assignment and reassignment;
- complete state flow;
- deterministic automatic priority;
- derived technician availability;
- freeze request with administrative approval/rejection;
- technician release and reassignment;
- resolution, administrative closure, and audit history.

Optional unless explicitly authorized:

- complete search and filters;
- administrator charts;
- average resolution-time metrics;
- photographic evidence;
- metrics by technician or machine type.

Out of scope unless explicitly changed:

- external integrations and third-party notifications;
- preventive or predictive maintenance;
- stock, spare-parts, or complete asset management;
- multiple active jobs queued to one technician;
- reopening closed tickets;
- full user CRUD when demo accounts are sufficient;
- AI-based priority or automatic business-data mutation by AI.

## Confirmed domain rules

### One ticket, one lifecycle

- One `Ticket` represents one reported failure and keeps the same ID through closure (`RN-01`).
- “Solicitud”, “Mantención”, and “Cierre” are stages/sections of the same ticket, not disconnected workflows.
- Relevant changes preserve actor and timestamp (`RN-15`).
- Tickets are never physically deleted (`RN-16`).
- `CLOSED` tickets are immutable and are not reopened (`RN-17`).

### Roles and authorization

Canonical roles:

- `REQUESTER` — Solicitante.
- `TECHNICIAN` — Técnico.
- `ADMIN` — Administrador.

Key permissions:

- A requester creates and views their own tickets and may edit only their own `NEW` ticket (`RN-02`).
- A technician also has requester capabilities for tickets they create. Only the currently assigned technician may start, record technical work, request a freeze, or resolve that maintenance (`RN-08`).
- Only an administrator assigns/reassigns technicians, decides freezes, marks a blocker resolved, overrides priority with a mandatory reason, and closes a `RESOLVED` ticket (`RN-04`, `RN-05`, `RN-14`, `RN-21`).

The NestJS API must derive actor and role from the authenticated identity. Never trust a client-supplied role, requester ownership, or technician ownership. Validate role, ticket ownership, current technician, and state in backend services/guards (`RN-18`).

### Ticket state machine

Canonical states:

`NEW`, `ASSIGNED`, `IN_PROGRESS`, `FREEZE_REQUESTED`, `FROZEN`, `PENDING_REASSIGNMENT`, `RESOLVED`, `CLOSED`.

Only these transitions are valid:

| Current                | Actor/action                         | Next                   |
| ---------------------- | ------------------------------------ | ---------------------- |
| `NEW`                  | `ADMIN` assigns available technician | `ASSIGNED`             |
| `ASSIGNED`             | Assigned technician starts           | `IN_PROGRESS`          |
| `IN_PROGRESS`          | Assigned technician resolves         | `RESOLVED`             |
| `IN_PROGRESS`          | Assigned technician requests freeze  | `FREEZE_REQUESTED`     |
| `FREEZE_REQUESTED`     | `ADMIN` rejects                      | `IN_PROGRESS`          |
| `FREEZE_REQUESTED`     | `ADMIN` approves                     | `FROZEN`               |
| `FROZEN`               | `ADMIN` marks blocker resolved       | `PENDING_REASSIGNMENT` |
| `PENDING_REASSIGNMENT` | `ADMIN` assigns available technician | `ASSIGNED`             |
| `RESOLVED`             | `ADMIN` closes                       | `CLOSED`               |

Validate transitions in backend domain/service logic. Do not allow `NEW -> IN_PROGRESS`, `IN_PROGRESS -> CLOSED`, `FROZEN -> IN_PROGRESS`, or any transition from `CLOSED`.

Every relevant transition records actor, timestamp, previous/new state, and detail/reason when applicable.

### Automatic priority

The user answers and the backend stores:

- `safetyRisk`;
- `equipmentStopped`;
- `productionImpact`;
- `workaroundAvailable`;
- `affectsOtherAreas`.

Evaluate in this exact order; the first match wins (`RN-03`):

1. `CRITICAL`: safety risk; or production stopped with no workaround.
2. `HIGH`: if not critical, equipment completely stopped; production stopped; production reduced with no workaround; or other areas/equipment affected.
3. `MEDIUM`: if not critical/high, equipment partially stopped or production reduced.
4. `LOW`: no earlier rule matches.

The frontend may preview but must not persist its own priority calculation. Only `ADMIN` may override the result, with a non-empty reason and history containing old/new priority, actor, and timestamp (`RN-04`). Do not replace this algorithm with scores, heuristics, or AI.

### Technician availability and assignment

- Availability is derived and cannot be edited manually (`RN-19`).
- A technician is `BUSY` with one ticket in `ASSIGNED`, `IN_PROGRESS`, or `FREEZE_REQUESTED`; otherwise they are `AVAILABLE`.
- A technician may have at most one active maintenance (`RN-06`, `RN-07`).
- Assignment is valid only from `NEW` or `PENDING_REASSIGNMENT`, by `ADMIN`, to an available technician.
- Revalidate availability in the backend at write time.
- If operations compete for one technician, only one may succeed. Use the transaction, lock, constraint, or equivalent supported by the selected PostgreSQL/ORM stack (`RN-20`).
- Preserve assignment history: technician, assigning administrator, assigned/released timestamps, and release reason. Never overwrite prior participation.

### Freeze, reassignment, resolution, and closure

- Only the assigned technician may request a freeze from `IN_PROGRESS`, with a required reason (`RN-10`). “Other” requires detail.
- While `FREEZE_REQUESTED`, the technician remains assigned and busy (`CA-13`).
- Rejection returns to `IN_PROGRESS`; the assignment remains active.
- Approval moves to `FROZEN`, releases the assignment, sets `currentTechnicianId` to null, and immediately makes the technician available while preserving history (`RN-11`, `CA-08`).
- A frozen ticket never resumes automatically. `ADMIN` moves it to `PENDING_REASSIGNMENT`, then assigns any available technician, original or different (`RN-12`, `RN-13`, `RN-21`). The technician must explicitly start again.
- Only the assigned technician resolves from `IN_PROGRESS`; `workPerformed` is required. Resolution sets `RESOLVED`, records the timestamp, releases the assignment, clears `currentTechnicianId`, and makes the technician available (`RN-09`).
- Only `ADMIN` closes, and only from `RESOLVED`; closure records administrator/timestamp and makes the ticket immutable (`RN-14`).

## Backend architecture and data integrity

Before backend changes, inspect installed Nx, NestJS, Node, package manager, ORM/database library, auth strategy, module boundaries, and test targets.

### Backend folder structure

Follow NestJS module-oriented naming under `apps/api/src/`:

```text
apps/api/src/
  main.ts
  app.module.ts
  database/
    # Connection configuration, data source, and migrations only after the ORM is approved.
  modules/
    auth/
      dto/
      guards/
      strategies/
      auth.controller.ts
      auth.module.ts
      auth.service.ts
    users/
      dto/
      entities/
      users.controller.ts
      users.module.ts
      users.service.ts
    tickets/
      dto/
      entities/
      tickets.controller.ts
      tickets.module.ts
      tickets.service.ts
    technicians/
      dto/
      technicians.controller.ts
      technicians.module.ts
      technicians.service.ts
    history/
      history.module.ts
      history.service.ts
    dashboard/
      # Create only when the optional dashboard is approved.
```

- Keep each capability's DTOs, entities, controller, module, service, and focused tests inside its own module folder.
- `auth/` owns authentication-specific guards and strategies. Do not place ticket authorization or transition rules in controllers or generic guards.
- `tickets/` owns the ticket lifecycle, priority, freeze, resolution, and closure rules. Split it only when a demonstrated need makes a submodule clearer.
- `technicians/` owns technician visibility and derived availability; assignment remains coordinated by the ticket workflow.
- `history/` owns history queries and persistence support. Ticket actions remain responsible for producing their own audit events atomically.
- `database/` contains infrastructure only; do not introduce a `data-source.ts`, entities, migrations, or ORM-specific layout until the ORM decision is approved.
- Do not create a generic `common/` folder preemptively. Add a shared backend location only for a real cross-module primitive.

- Do not introduce a second ORM, validation library, or auth strategy.
- Keep business rules in services/domain logic, not controllers.
- Controllers parse transport input, use authenticated identity, call services, and map responses.
- Use typed DTOs and validate external input at the API boundary.
- Do not accept server-derived fields as authoritative client input.
- Prefer enums/unions and avoid `any`.
- Use transactions when one action updates ticket state, assignment, freeze/resolution/closure data, and history.
- A failed operation must not leave partial state.
- Do not expose password hashes, secrets, or full tokens.
- Do not leak tickets across role/ownership boundaries.

The model in `docs/DATA_MODEL.md` is recommended, not an irreversible schema decision. Do not invent API endpoints; use `Contrato pendiente de definición` until approved, as described in `docs/API_CONTRACTS.md`.

## Frontend architecture and UX

Before frontend changes, inspect installed Angular/Nx versions, routing, auth patterns, styling libraries, and existing shared components.

### Frontend folder structure

Follow this application structure under `apps/web/src/app/`:

```text
apps/web/src/app/
  core/
    # Singleton infrastructure: auth/session, guards, interceptors,
    # application-wide services, configuration, and global models.
  layout/
    # App shell, navigation, top bar, side navigation, and page containers.
  features/
    tickets/
      # Feature routes, pages, feature-only components, data access, and models.
    technicians/
    dashboard/        # Only when the optional dashboard is approved.
    auth/             # Only if login needs feature-specific UI beyond core auth.
  shared/
    components/
      # Repository-owned, feature-agnostic Angular components reused by two or more areas.
  app.config.ts
  app.routes.ts
```

Use Nx libraries for Spartan/Helm UI primitives:

```text
libs/shared/ui/
  button/
  input/
  dropdown-menu/
  tooltip/
  utils/
```

- `core/` is singleton infrastructure, never a place for ticket business logic or page components.
- `layout/` composes the persistent application chrome and must not own feature state.
- `features/` owns feature routes, pages, feature-specific components, state, data access, and models. A component used by one feature stays there.
- `shared/` in the application is reserved for repository-owned reusable components. Do not place Spartan primitives, feature data access, business rules, or speculative utilities there.
- `libs/shared/ui/` is reserved for reusable Spartan/Helm primitives and their utilities. It must not depend on `apps/web` features, layouts, services, or domain models.
- Preserve the dependency direction: `features -> shared/components and libs/shared/ui`; `layout -> shared/components and libs/shared/ui`; `core` remains independent from features.
- The currently generated Spartan components under `apps/web/src/app/shared/ui/` do not match this target structure. Do not move them as part of unrelated work; migrate them in a dedicated Nx-aware task when approved.

- Follow repository conventions; do not import architecture from unrelated projects.
- Use typed forms, inputs, outputs, models, and API boundaries; avoid `any`.
- Keep templates declarative and business-critical calculations in the backend.
- Keep user-visible copy in Spanish and technical identifiers in English.
- Reuse the same ticket-detail foundation when practical.
- Show or disable actions according to role/state, but never treat this as authorization.
- Busy technicians must not be selectable for assignment.
- Do not communicate priority or status using color alone.
- Provide useful loading, empty, error, success, and disabled states for implemented flows.
- Do not suggest edit, delete, or reopen actions for `CLOSED` tickets.
- Do not invent screens beyond `docs/SCREENS_AND_NAVIGATION.md`.

## History, demo data, and performance

- History is part of the MVP. Preserve creation, permitted edits, priority calculation/override, assignments, starts, freeze decisions, blocker resolution, resolution, and closure.
- History entries contain actor, timestamp, action, states when applicable, and relevant detail/reason.
- Demo data must be fictitious and safe to publish. Use development-only credentials.
- When seed work is authorized, prepare one user per role, at least two technicians, available/busy examples, multiple states/priorities, a freeze/reassignment case, and a full normal flow.
- Control loading for growing lists/history and avoid obvious N+1 queries. Do not add caching without a measured need.
- If average resolution time is explicitly authorized, sum only periods in `IN_PROGRESS`; exclude `FROZEN` and `PENDING_REASSIGNMENT`.

## Testing and validation

Tests should protect observable business behavior, not private implementation details.

Prioritize:

- unit tests for priority, transition policy, availability, and isolated role/action policy;
- service/integration tests for assignment, busy-technician rejection, ownership, freeze decisions, release, reassignment, resolution, closure, history, and concurrency when practical;
- targeted E2E for a complete critical flow when the phase covers it and an E2E project exists.

Validation must be proportional to the actual diff:

| Change                                                                       | Required validation                                                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Documentation, comments, static copy, visual-only UI                         | Review the diff; inspect an already-running preview when useful. Do not automatically run tests, lint, build, E2E, formatters, or `nx affected`. |
| Frontend behavior, forms, conditions, events, guards, or API integration     | Run the smallest relevant frontend tests; add type/lint/build only for a concrete introduced risk.                                               |
| Backend business rules                                                       | Run the smallest relevant unit/service/integration tests.                                                                                        |
| Contracts, routing, auth, dependencies, configuration, schema, or migrations | Run targeted behavior tests plus the smallest relevant type/lint/build and database validation.                                                  |
| Complete integrated flow                                                     | Run a targeted E2E when it exists and is practical.                                                                                              |

Use only scripts/targets that exist. Prefer `npx nx ...`; do not assume global Nx. Do not run the entire workspace automatically.

If required validation fails, fix phase-owned failures within scope, report unrelated failures, and do not claim completion while phase-owned failures remain.

## Phased implementation and Git

When work is divided into phases:

1. Inspect relevant code, documents, rules, and acceptance criteria.
2. Restate the authorized phase scope.
3. Implement only that phase; do not prepare later phases.
4. Keep behavior and protecting tests in the same phase.
5. Review the complete diff for scope, correctness, sensitive data, and generated noise.
6. Run proportional validation.
7. Report outcome, files, validation, database impact, assumptions, blockers, and out-of-scope follow-up.
8. Stop and wait for approval before the next phase.

Do not stage or commit unless explicitly authorized. Do not amend, rebase, squash, push, open a pull request, merge, delete branches, or discard user work unless explicitly requested.

Use English for code identifiers, filenames, directories, routes, tests, branches, and commits. Use Spanish for user-visible product copy and established business terminology. Follow existing TypeScript and filename conventions.

## Scope control

Avoid microservices, event buses, CQRS, generic workflow engines, plugin architectures, speculative shared libraries, multiple databases, distributed state, or other premature infrastructure unless an immediate approved requirement justifies them.

Prefer the smallest design that safely preserves the approved rules and can evolve later. Reliable demo behavior takes priority over optional polish.

## Completion report

At the end of an authorized phase, report:

- user-visible or architectural outcome;
- business rules and acceptance criteria addressed;
- files/projects changed;
- validation executed and results;
- database/migration impact;
- assumptions and unresolved blockers;
- follow-up work outside the current phase.

Then stop and wait for approval before continuing.
