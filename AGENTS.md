# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Language

Todas as interações, prompts, análises e discussões devem ser realizadas em **Português do Brasil**.

## Visão geral do projeto

**DIVI** — aplicativo de divisão de despesas domésticas (estilo Splitwise). Multi-inquilino: cada "casa" tem membros que compartilham cartões de crédito, acompanham gastos e liquidam saldos por compensação (netting). Identidade visual lúdica (tema "Família" — livro de histórias da Pixar em papel creme).

- **Frontend:** Vue 3 + TypeScript + Tailwind CSS v4 + Vite
- **Backend:** Go 1.23 + Gin + PostgreSQL + GORM + Gorilla WebSocket
- **Gerenciador de pacotes:** pnpm v11, Node ≥24

## Comandos

```bash
# Frontend (raiz)
pnpm dev              # Dev server Vite (http://localhost:5173)
pnpm build            # vue-tsc typecheck + vite build
pnpm preview          # Preview da build de produção
pnpm test             # Todos os testes Vitest
pnpm test:watch       # Vitest em watch mode
npx vitest --run src/path/to/file.test.ts  # Arquivo único
npx eslint src/       # Lint
npx knip              # Código morto / exportações não usadas

# Backend (backend-go/)
cd backend-go
go run ./cmd/server/          # Iniciar API (porta 3000)
go test ./...                 # Todos os testes Go
go test -v -run TestNome ./internal/...  # Teste único
golangci-lint run             # Lint (.golangci.yml)
```

## Arquitetura

### Frontend (`src/`)

```
src/
  main.ts                  # createApp, router, error boundary → window.dispatchEvent('divi:app-error')
  App.vue                  # Auth state, WS connection, data init, app-level error display
  main.css                 # Tailwind v4 @theme tokens + base @layer components
  router/
    index.ts               # Hash-based routes (login, select-tenant, dashboard)
    guards.ts              # Redirect guards: auth → tenant → dashboard
  models/
    entities/              # Domain types: Cartao, Fatura, Gasto, Membro, ContaFixa, Dinheiro, DivisaoDeGasto
    repositories/
      I*Repository.ts      # Repository interfaces (IGastoRepository, ICartaoRepository, etc.)
      http/Http*Repository.ts  # fetch-based implementations consuming the Go API
    services/              # Business logic: GastoService, FaturaService, LancamentoService,
                           # MembroService, NettingService, TenantSessionService, SocketService
  viewmodels/              # Vue composables bridging services → views
                           # useDashboardViewModel, useMembros, useCartoesEFaturas, useContasFixas, etc.
  views/
    components/
      ui/                  # Design system: Button, Card, BottomSheet, BottomTabBar, MembroAvatar,
                           # IllustrationMascot, SkeletonBlock, ToastNotification, AppBar
      wizard/              # Expense wizard steps (value, description, members, split, payment)
      ledger/              # Domain components: ActivityFeed, ContasFixasPanel, NettingPanel
        dashboard/         # Dashboard-specific: DashboardHeader, UnifiedBalancePanel, DetalhamentoSaldosCard
        membros/           # Member management: MembroForm, MembroListItem
      settings/            # Settings tabs: PerfilUsuario, ConfiguracoesCasa, GestaoAcesso
    screens/               # Top-level views: DashboardSaldos, ConfiguracoesMembros,
                           # LoginScreen, TenantSelectorScreen, OnboardingWizard, etc.
  composables/             # Generic composables: useToast, useAsync
  shared/
    container.ts           # Manual DI — instantiates all repos/services as singletons
    types/                 # Shared TypeScript types
    utils/                 # formatarMoeda, rateio, logger, mensagemErro, meses, gastoPeriodo, etc.
    validation/            # Zod schemas (apiSchemas.ts) + contract tests (apiContracts.test.ts)
```

**Padrões de design do frontend:**

- **Repository Pattern** — interfaces em `I*Repository.ts`; implementações HTTP em `Http*Repository.ts`
- **ViewModel Layer** — composables em `viewmodels/` mantêm estado reativo e chamam services; componentes Vue são primariamente template + data binding
- **Manual DI** — `shared/container.ts` cria e conecta services e repositories como singletons; todo o resto importa do container
- **Zod Contract Validation** — `apiSchemas.ts` define schemas Zod para toda resposta de API; `TenantSessionService` e `SocketService` validam respostas em runtime, quebrando explicitamente se o contrato divergir
- **WebSocket Sync** — `SocketService` mapeia eventos WS (`EXPENSE_CREATED`, `CARD_UPDATED`, etc.) → eventos internos (`gastos_alterados`, `cartoes_alterados`); faz preflight HTTP antes de abrir WS para detectar 401/403 com JSON em vez de erro opaco
- **Event Bus** — `window.dispatchEvent` com prefixo `divi:` (`divi:tenant-changed`, `divi:auth-expired`, `divi:app-error`)
- **BottomSheet Pattern** — todos os fluxos de criação/edição usam `BottomSheet` com 90–95dvh; altura de botões padronizada em `h-12`
- **Hash Routing** — `createWebHashHistory`; lazy-loading de screens com `() => import(...)`

### Backend (`backend-go/`)

```
backend-go/
  cmd/server/main.go       # Entry: config, DB, repos, services, handlers, Gin routes, WS upgrade
  internal/
    config/                # Env vars (DATABASE_URL, JWT_SECRET, SMTP, etc.)
    database/              # DB bootstrap (CREATE DATABASE IF NOT EXISTS), AutoMigrate, raw SQL runner
    model/                 # GORM models: Tenant, Usuario, MembroCasa, Cartao, Fatura, Gasto, DivisaoGasto, etc.
    repository/            # GORM repository implementations + interfaces
    service/               # AuthService, FinanceiroService, EmailService
    handler/               # Gin handlers: auth_handler, financeiro_handler, health_handler
    middleware/             # CORS, JWT (Bearer), TenantRequired, RoleRequired, RateLimit, CSRF, SecurityHeaders
    dto/                   # Request/response DTOs
    websocket/             # Gorilla WebSocket hub + client handler
    validator/             # Custom Gin validators (password strength, etc.)
  migrations/              # Raw SQL migrations (GORM can't express everything)
```

**Padrões de design do backend:**

- **Arquitetura em camadas** — Handler → Service → Repository → GORM/DB
- **Cadeia de middleware** — SecurityHeaders → CORS → (JWTAuth → CSRF → TenantRequired → RoleRequired → RateLimit)
- **Multi-tenant isolation** — `TenantRequired` middleware extrai `X-Tenant-ID` do header, verifica membership do usuário; todas as queries são scoped ao tenant
- **RBAC** — `RoleRequired` restringe endpoints: `ADMIN | MORADOR` para escrita geral, `ADMIN` exclusivo para gestão de permissões
- **WebSocket com preflight** — handler `/ws` valida token e membership ANTES do upgrade; retorna 401/403 como JSON em vez de erro opaco do navegador
- **Rate limiting** — auth endpoints: 5/min; invite preview: 10/min; write endpoints: 60/min
- **Error sanitization** — em `ReleaseMode`, erros internos viram "Ocorreu um erro interno"; em debug, mensagem original é preservada
- **API prefix** `/api/`, Swagger em `/swagger/index.html` (habilitado via `SWAGGER_ENABLED=true`)

## Fluxo de dados

```
[Vue Component] → [ViewModel (composable)] → [Service] → [Repository (fetch)] → [Go API /api/]
                                                                                      ↓
[Vue Component] ← [ViewModel (reativo)]   ← [SocketService] ← [WebSocket /ws] ← [Hub broadcast]
```

Mutações no backend disparam `wsHub.Broadcast(tenantID, event)`. O `SocketService` do frontend recebe, valida payload com Zod, e dispara eventos internos (`gastos_alterados`, etc.) que os viewmodels escutam para recarregar dados.

## Fluxo de autenticação

1. Login (email/senha ou Google OAuth) → JWT (HS256) armazenado em `localStorage` (`divi_jwt_token`)
2. `GET /api/auth/me` → retorna lista de tenants (casas) do usuário
3. Usuário seleciona/cria tenant → `X-Tenant-ID` armazenado; todas as requests incluem este header
4. Guards de rota: não autenticado → `/login`, sem tenant → `/select-tenant`, ok → `/dashboard`

## Variáveis de ambiente

**Frontend (`.env`):**
- `VITE_API_URL` — URL da API (default `http://localhost:3000`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

**Backend (`backend-go/.env`):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing key (HS256)
- `PORT` — server port (default 3000)
- `GOOGLE_CLIENT_ID` — Google OAuth
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` — Zoho email
- `FRONTEND_URL` — CORS origin
- `CORS_ORIGINS` — comma-separated allowed origins (default `http://localhost:5173`)
- `SWAGGER_ENABLED` — enable `/swagger/*` (default false)
- `GIN_MODE` — `debug` | `release` (controls error message verbosity)

## Sistema de design

Tokens definidos em `src/main.css` (Tailwind v4 `@theme`) e `DESIGN.md`. Cores: neutros quentes (canvas `#fbfaf9`, stone `#f2f0ed`, graphite `#474645`, charcoal `#343433`) + acentos vibrantes (ember `#ff3e00`, meadow `#00a83d`, sky `#0090ff`). Tipografia: Fraunces 700 para headings, Inter para UI. Cards usam `shadow-subtle` (inset border) em vez de drop shadows. Navegação: "Floating Island" — barra pill-shaped com glassmorphism.

## Convenções de código

- **Nomes:** camelCase no frontend (TS/Vue), PascalCase (exported) / camelCase (private) no backend (Go)
- **Idioma:** strings de UI e comentários em português; identificadores de código em inglês
- **Testes:** Vitest no frontend (`.test.ts` ao lado do source), `go test` no backend (arquivos `_test.go`)
- **Validação de API:** Zod no frontend (`apiSchemas.ts`) valida toda resposta; quebra explícita em contrato divergente
- **Modelagem de dinheiro:** centavos como `int64` no backend, classe `Dinheiro` no frontend (nunca `float`)
- **Repositories:** estendem `IRepository<T>` genérico com métodos específicos (`salvarMuitos`, `excluirMuitos`)
- **Tratamento de erros:** services retornam `false` ou lançam; viewmodels capturam e usam `useToast().show()`

## Dicas para agentes de IA

- **O container é a fonte da verdade:** `src/shared/container.ts` mostra todas as dependências e como são conectadas. Comece por ele para entender o grafo de serviços.
- **Schemas Zod são contratos:** `src/shared/validation/apiSchemas.ts` define a forma exata de cada resposta da API. Se um campo não está lá, o backend não o envia.
- **Nunca use float para dinheiro:** todo valor monetário é `int64` (centavos) no backend e instância de `Dinheiro` no frontend.
- **Todo state transiente vai nos viewmodels:** estado de UI (abertura de modal, loading, item selecionado) vive nos composables em `viewmodels/`, nunca nos componentes Vue diretamente.
- **WebSocket NÃO é opcional:** dados stale são inaceitáveis. Toda mutation no backend dispara broadcast; o frontend depende disso para manter consistência entre abas/dispositivos.
- **Hash routing:** as rotas usam `#/` — `window.location.hash`, não `window.location.pathname`.
- **Backend Go module path:** `github.com/luansilvadb/financeiro-divi/backend-go` — use este path para imports internos.
- **Migrations:** GORM `AutoMigrate` cobre schema base; SQL bruto em `migrations/` cobre constraints e alterações que GORM não expressa.
