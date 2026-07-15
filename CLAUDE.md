# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DIVI** — a household expense splitting app (similar to Splitwise). Multi-tenant: each "casa" (house) has members who share cards, track expenses, and settle balances via netting. The visual identity is playful ("Family" theme — Pixar storybook on cream paper) with mascot illustrations and warm tones.

- **Frontend:** Vue 3 + TypeScript + Tailwind CSS v4 + Vite
- **Backend:** Go (Gin) + PostgreSQL + GORM + WebSockets
- **Package manager:** pnpm (v11), Node ≥24

## Commands

```bash
# Frontend (root)
pnpm dev            # Vite dev server (http://localhost:5173)
pnpm build          # Type-check with vue-tsc, then vite build
pnpm preview        # Preview production build
pnpm test           # Run all Vitest tests
pnpm test:watch     # Vitest in watch mode
npx vitest --run src/path/to/file.test.ts  # Run a single test file
npx eslint src/     # Lint
npx knip            # Dead code / unused exports check

# Backend (backend-go/)
cd backend-go
go run ./cmd/server/   # Start API server (port 3000 by default)
go test ./...           # Run all Go tests
go test -v -run TestNome ./internal/...  # Run a single Go test
golangci-lint run       # Lint (config in .golangci.yml)
```

## Architecture

### Frontend (`src/`)

```
src/
  main.ts                  # App entry: createApp, router, error boundary
  App.vue                  # Root: auth state, WS connection, data init, app-level error display
  main.css                 # Tailwind v4 @theme tokens + @layer components/base
  router/
    index.ts               # Hash-based routes (login, dashboard, select-tenant, etc.)
    guards.ts              # Auth + tenant-selection redirect guards
    DashboardView.vue      # Shell: tab-bar (hoje/mês/pessoal/perfil), FAB → wizard, BottomSheets
  models/
    entities/              # Domain types: Cartao, Fatura, Gasto, Membro, etc.
    repositories/
      I*Repository.ts      # Repository interfaces
      http/Http*Repository.ts  # HTTP fetch-based implementations
    services/              # Business logic: GastoService, FaturaService, MembroService,
                           # LancamentoService, NettingService, TenantSessionService, SocketService
  viewmodels/              # Vue composables bridging services → views
                           # useDashboardViewModel, useMembros, useCartoesEFaturas, useContasFixas, etc.
  views/
    components/
      ui/                  # Design system: Button, Card, BottomSheet, BottomTabBar, MembroAvatar,
                           # IllustrationMascot, SkeletonBlock, ToastNotification, AppBar
      wizard/              # Expense entry wizard steps (value, description, members, split, payment)
      ledger/              # Domain components: ActivityFeed, ContasFixasPanel, NettingPanel, etc.
        dashboard/         # Dashboard-specific: DashboardHeader, UnifiedBalancePanel, etc.
        membros/           # Member management: MembroForm, MembroListItem
      settings/            # Settings tabs: PerfilUsuario, ConfiguracoesCasa, GestaoAcesso
    screens/               # Top-level views: DashboardSaldos, ConfiguracoesMembros,
                           # NovoLancamentoWizard, LoginScreen, etc.
  composables/             # Generic composables: useToast, useAsync
  shared/
    container.ts           # Manual DI — instantiates all repos, services as singletons
    types/                 # Shared TypeScript types
    utils/                 # formatarMoeda, rateio, logger, mensagemErro, meses, etc.
```

Key design patterns:
- **Repository pattern** — interfaces in `models/repositories/`, HTTP implementations consume the Go API
- **ViewModel layer** — composables in `viewmodels/` hold reactive state and call services; Vue components are mostly template + wiring
- **Manual DI** — `shared/container.ts` creates and wires all services; components import what they need directly
- **WebSocket sync** — `SocketService` maps backend WS message types to frontend events with auto-reconnect; `App.vue` listens and refreshes data on changes
- **Event bus** — `window` custom events (`divi:tenant-changed`, `divi:auth-expired`, `divi:app-error`) for cross-component communication
- **BottomSheet modal pattern** — all create/edit flows use the `BottomSheet` component with 90-95dvh height

### Backend (`backend-go/`)

```
backend-go/
  cmd/server/main.go       # Entry: config, DB, repos, services, handlers, Gin routes, WS upgrade
  internal/
    config/                # Env config (DATABASE_URL, JWT_SECRET, SMTP, etc.)
    database/              # DB bootstrap (creates DB if missing), migrations (AutoMigrate)
    model/                 # GORM models: Tenant, Usuario, MembroCasa, Cartao, Fatura, Gasto, etc.
    repository/            # GORM repository implementations
    service/               # AuthService, FinanceiroService, EmailService, WS Hub
    handler/               # Gin handlers: auth_handler, financeiro_handler, health_handler
    middleware/             # CORS, JWT auth (Bearer token), TenantRequired, RoleRequired, RateLimit
    dto/                   # Request/response DTOs
    websocket/             # Gorilla WebSocket hub + client handling
    validator/             # Custom Gin validators (password strength, etc.)
  migrations/              # Raw SQL migrations
```

Key patterns:
- **Layered architecture** — Handler → Service → Repository → GORM/DB
- **Multi-tenant isolation** — `TenantRequired` middleware extracts tenant from header/context; all queries scoped
- **Role-based access** — `RoleRequired` middleware gates write endpoints to ADMIN + MORADOR
- **WebSocket hub** — broadcasts events (EXPENSE_CREATED, CARD_UPDATED, etc.) to all connections in the same tenant
- **API prefixed** at `/api/`, Swagger docs at `/swagger/index.html`

## Design System

Tokens are defined in both `src/main.css` (Tailwind v4 `@theme`) and `DESIGN.md` (the canonical spec). Colors use warm neutrals (canvas, stone, graphite, charcoal) with vivid brand accents (ember `#ff3e00`, meadow `#00a83d`, sky `#0090ff`). Typography: Fraunces for display headings, Inter for UI text. Cards use inset shadows (`shadow-subtle`) instead of external drop shadows. Navigation is a "Floating Island" (glassmorphism pill bar).

## Auth Flow

1. Email/password or Google OAuth login → JWT token stored in localStorage
2. Session loaded from `GET /api/auth/me` → returns list of tenants (casas)
3. User selects/creates a tenant → tenant ID stored, all data scoped by tenant
4. Route guards redirect: unauthed → `/login`, authed+no tenant → `/select-tenant`, authed+tenant → `/dashboard`

## Environment Variables

**Frontend (`.env`):**
- `VITE_API_URL` — backend API URL (default `http://localhost:3000`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

**Backend (`backend-go/.env`):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing key
- `PORT` — server port (default 3000)
- `GOOGLE_CLIENT_ID` — Google OAuth
- `SMTP_*` — email sending config (Zoho)
- `FRONTEND_URL` — CORS origin
