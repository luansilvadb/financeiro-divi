# SPDD Analysis: Falha de Deploy — Incompatibilidade Node.js 18 / pnpm 11 no Nixpacks (Easypanel)

## Original Business Requirement

```
Commit: feat: implement Google OAuth authentication flow with backend federation and update Vite CORS policy

O deploy do backend (divi-backend) no Easypanel falha na etapa de build Docker
(Nixpacks). O erro ocorre no step `pnpm i --frozen-lockfile`:

TypeError [ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING]: A dynamic import callback
was not specified.
    at new NodeError (node:internal/errors:405:5)
    at importModuleDynamicallyCallback (node:internal/modules/esm/utils:182:9)
    at Object.<anonymous> (/root/.cache/node/corepack/pnpm/11.1.0/bin/pnpm.cjs:3:1)

Node.js v18.20.5

O ambiente Nixpacks monta: nodejs_18, pnpm-9_x, openssl.
O corepack instala pnpm@11.1.0 (conforme packageManager no package.json),
que é incompatível com Node.js 18.

Warnings adicionais do Docker:
- SecretsUsedInArgOrEnv: ARG/ENV JWT_SECRET (segurança)
- UndefinedVar: $NIXPACKS_PATH (variável não definida)
```

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Monorepo pnpm workspace**: O projeto é um monorepo com `pnpm-workspace.yaml` definindo dois packages: raiz (frontend Vue/Vite) e `backend/` (NestJS). Ambos declaram `"packageManager": "pnpm@11.1.0"` nos respectivos `package.json`.
- **Backend NestJS**: API REST com Prisma ORM, autenticação JWT, Google OAuth (`google-auth-library`), WebSockets (Socket.IO), Swagger. Deploy atual via Easypanel + Nixpacks → Docker.
- **Frontend Vue/Vite**: SPA Vue 3 com Tailwind CSS 4, deploy separado (Vercel/outro). O `engines` do root `package.json` especifica `"node": ">=24.0.0"` — refletindo o ambiente de dev local, mas irrelevante para o deploy do backend.
- **Easypanel/Nixpacks pipeline**: O build do backend é feito pelo Nixpacks que gera um Dockerfile automático. O Nixpacks detecta `nodejs_18` como versão do Node — sem nenhum override explícito (sem `engines` no `backend/package.json`, sem `.nvmrc`, sem `nixpacks.toml`).
- **Corepack**: O Nixpacks instala `corepack@0.24.1` manualmente, depois roda `corepack enable`. O corepack lê o campo `packageManager` e baixa `pnpm@11.1.0`.

### New Concepts Required

- **Configuração explícita de versão Node no backend**: Necessário introduzir um mecanismo que force o Nixpacks a usar Node.js >= 22 (ou downgrade do pnpm para 9.x, compatível com Node 18).
- **Gestão de secrets Docker segura**: Substituir `ARG`/`ENV` para `JWT_SECRET` por Docker secrets ou `.env` em runtime (não no build-time).

### Key Business Rules

- **pnpm 11.x é pure ESM e requer Node.js >= 22**: Esta é a causa raiz do erro. O Nixpacks provisiona Node 18, corepack resolve pnpm 11.1.0, e o runtime crasha com `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`.
- **Backend precisa buildar e rodar de forma determinística no Easypanel**: Qualquer solução precisa funcionar tanto localmente quanto no pipeline Nixpacks, sem intervenção manual.
- **O workspace root define `engines.node >= 24.0.0`** mas o backend não herda isso no Nixpacks — cada package é buildado isoladamente.

## Strategic Approach

### Solution Direction

O caminho mais robusto é **alinhar a versão do Node.js no ambiente de build do backend com o requisito do pnpm 11.x**. Duas opções viáveis:

**Opção A (recomendada): Subir Node.js para 22+ no backend**
- Adicionar `"engines": { "node": ">=22.0.0" }` no `backend/package.json`
- Opcionalmente, criar `backend/.nvmrc` com `22`
- O Nixpacks lerá o `engines` e provisionará `nodejs_22`

**Opção B: Fazer downgrade do pnpm para 9.x**
- Mudar `"packageManager": "pnpm@9.15.9"` em ambos `package.json`
- Compatível com Node 18, mas trava o projeto numa versão antiga do pnpm

### Key Design Decisions

| Decisão | Trade-offs | Recomendação |
|---------|-----------|--------------|
| **Node 22+ vs manter Node 18** | Node 22 é LTS desde out/2024, amplamente suportado pelo Nixpacks. Node 18 saiu de LTS em abr/2025 (EOL). Manter Node 18 é dívida técnica crescente. | → **Node 22+**. A stack NestJS 10 + Prisma 5 é compatível com Node 22. Sem risco funcional. |
| **Onde declarar a versão Node** | `engines` no `package.json` é o método padrão que o Nixpacks respeita. `.nvmrc` também funciona. `nixpacks.toml` é mais explícito mas acoplado. | → **`engines` no `package.json` do backend** + `.nvmrc` como fallback |
| **pnpm 11.x vs downgrade para 9.x** | pnpm 11 é a versão que o projeto já usa localmente. Downgrade causaria diff no `pnpm-lock.yaml` e potencial regressão. | → **Manter pnpm 11.x**, pois alinhar o Node resolve o problema sem forçar downgrade |
| **Secrets no Docker build** | Os warnings de `SecretsUsedInArgOrEnv` são reais — `JWT_SECRET` exposta em layer Docker. Mas o Nixpacks gera o Dockerfile automaticamente; a fix precisa ser no Easypanel (env vars de runtime, não build args). | → **Mover JWT_SECRET para runtime** se o Easypanel permitir, mas é secundário ao fix do deploy |

### Alternatives Considered

- **Custom Dockerfile no backend**: Bypass do Nixpacks com Dockerfile explícito. Rejeitado porque aumenta manutenção e o Nixpacks é suficiente com a config correta.
- **`NIXPACKS_NODE_VERSION` env var no Easypanel**: Funciona, mas é frágil (depende de config fora do repo). Preferível ter `engines` no código-fonte.
- **Criar `nixpacks.toml` com nixpkgsArchive**: Overengineering para o caso. Reservar para quando precisar de uma versão específica de Node (ex: 22.14.0 exato).

## Risk & Gap Analysis

### Requirement Ambiguities

- **Qual versão exata de Node.js usar?** O Nixpacks suporta Node 22 e 23. Node 22 é a escolha segura (LTS). Node 24 pode não estar disponível ainda no nixpkgs snapshot do Nixpacks. O root `package.json` declara `>=24.0.0` mas isso é para dev local.
- **O Easypanel passa `DATABASE_URL` como build arg**: O Prisma precisa do `DATABASE_URL` no `postinstall` (para `prisma generate`). Isso é legítimo para `generate`, mas pode causar problemas se o DB não estiver acessível no build. Verificar se `prisma generate` funciona sem conectar ao DB (sim, funciona — usa apenas o schema).

### Edge Cases

- **pnpm-lock.yaml do workspace vs backend isolado**: O Nixpacks builda a partir do diretório `backend/`. Se o `pnpm-lock.yaml` do backend estiver out-of-sync com o do root, o `--frozen-lockfile` falhará. Necessário garantir consistência.
- **Corepack 0.24.1 vs pnpm 11.1.0**: Mesmo com Node 22, corepack 0.24.1 pode ter problemas de assinatura com pnpm 11.x. Monitorar se o fix do Node resolve, caso contrário, subir corepack.
- **Warning `$NIXPACKS_PATH` undefined**: Indica que o Dockerfile gerado referencia uma variável que o Nixpacks não define. Pode causar `PATH` incompleto no container. Provavelmente inofensivo (o Nixpacks configura o PATH via nix-env), mas vale investigar se persistir após o fix.

### Technical Risks

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Nixpacks não reconhece `engines.node: ">=22"` e continua usando Node 18** | Build continua falhando | Testar com valor exato `"22"` em vez de range. Fallback: usar `.nvmrc` ou `NIXPACKS_NODE_VERSION` env var no Easypanel |
| **Dependências nativas incompatíveis com Node 22** | Build falha em outro step | Baixo risco: Prisma 5, NestJS 10, bcryptjs são compatíveis com Node 22. Prisma engine é binária standalone. |
| **JWT_SECRET exposta em Docker layer** | Segurança: secret legível no image layer | Secundário ao fix de deploy, mas deve ser endereçado movendo para runtime env no Easypanel |
| **`postinstall: prisma generate` sem DB acessível** | Falha de build se generate tentar conectar | Sem risco: `prisma generate` usa apenas o schema, não conecta ao DB |

### Acceptance Criteria Coverage

| AC# | Descrição | Endereçável? | Gaps/Notas |
|-----|-----------|-------------|------------|
| 1 | Backend builda com sucesso no Nixpacks/Easypanel | Sim | Fix principal: alinhar Node.js com pnpm |
| 2 | Google OAuth funciona pós-deploy | Sim | Depende do GOOGLE_CLIENT_ID estar configurado como env var no Easypanel |
| 3 | Warnings de segurança Docker resolvidos | Parcial | JWT_SECRET como build arg é limitação do pipeline Nixpacks/Easypanel, não do código |
| 4 | Warning `$NIXPACKS_PATH` resolvido | Parcial | Provavelmente inofensivo; investigar pós-fix |
