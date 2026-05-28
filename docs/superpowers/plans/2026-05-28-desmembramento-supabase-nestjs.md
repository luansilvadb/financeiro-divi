# Desmembramento do Supabase e Integração com NestJS e PostgreSQL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar a persistência do DIVI de uma arquitetura híbrida (LocalStorage + Supabase) para um banco de dados PostgreSQL centralizado, consumido por um backend NestJS estruturado programaticamente na inicialização (self-healing DDL).

**Architecture:** O frontend Vue 3 consumirá diretamente APIs REST expostas pelo backend NestJS via Repositórios HTTP baseados em fetch com cabeçalho JWT. O backend NestJS gerenciará a conexão direta com o PostgreSQL nativo usando o Prisma ORM e executará as migrações automáticas de DDL no bootstrap.

**Tech Stack:** NestJS, Prisma ORM, PostgreSQL, JWT, Vue 3, Vitest.

---

## 1. Mapeamento de Arquivos a Criar e Modificar

### Backend NestJS (Novo)
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/prisma/schema.prisma`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/prisma/prisma.service.ts`
- `backend/src/prisma/prisma.module.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/jwt-auth.guard.ts`
- `backend/src/financeiro/financeiro.module.ts`
- `backend/src/financeiro/financeiro.controller.ts`
- `backend/src/financeiro/financeiro.service.ts`

### Frontend (Modificados / Removidos)
- **Remover**: `src/models/repositories/local/` (todos os repositórios locais)
- **Remover**: `src/models/repositories/supabase/` (todos os repositórios Supabase)
- **Remover**: `src/shared/supabase.ts`, `src/shared/supabase.test.ts`
- **Remover**: `src/shared/utils/StorageLock.ts`, `src/shared/utils/StorageLock.test.ts`
- **Remover**: `src/models/services/MigrationService.ts`, `src/models/services/MigrationService.test.ts`
- **Modificar**: `src/shared/container.ts` (apontará para os repositórios HTTP de forma estática)
- **Modificar**: `src/models/services/TenantSessionService.ts` (gerenciamento de JWT e Active Tenant via localStorage simples)
- **Modificar**: `src/App.vue` (remover imports órfãos e lógica de concorrência/sync)
- **Modificar**: `src/vite-env.d.ts` (remover tipos de variáveis do Supabase)
- **Criar**: `src/models/repositories/http/HttpMembroRepository.ts`
- **Criar**: `src/models/repositories/http/HttpCartaoRepository.ts`
- **Criar**: `src/models/repositories/http/HttpFaturaRepository.ts`
- **Criar**: `src/models/repositories/http/HttpGastoRepository.ts`
- **Criar**: `src/models/repositories/http/HttpContaFixaRepository.ts`
- **Criar**: `src/models/repositories/http/HttpAcertoMembroRepository.ts`
- **Criar**: `src/models/repositories/http/HttpBaseRepository.ts` (base para fetch com autenticação)

---

## Tasks de Implementação

### Task 1: Setup da Estrutura Inicial do Backend (NestJS + Prisma)

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/prisma/prisma.module.ts`

- [ ] **Step 1: Criar o arquivo package.json no backend**
  Escrever `backend/package.json` com dependências de NestJS, Prisma e JWT:
  ```json
  {
    "name": "divi-backend",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "build": "nest build",
      "start": "nest start",
      "start:dev": "nest start --watch",
      "start:prod": "node dist/src/main",
      "test": "jest"
    },
    "dependencies": {
      "@nestjs/common": "^10.0.0",
      "@nestjs/core": "^10.0.0",
      "@nestjs/jwt": "^10.0.0",
      "@nestjs/passport": "^10.0.0",
      "@nestjs/platform-express": "^10.0.0",
      "@prisma/client": "^5.0.0",
      "bcrypt": "^5.1.0",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.0",
      "passport": "^0.6.0",
      "passport-jwt": "^4.0.1",
      "reflect-metadata": "^0.1.13",
      "rxjs": "^7.8.0"
    },
    "devDependencies": {
      "@nestjs/cli": "^10.0.0",
      "@nestjs/schematics": "^10.0.0",
      "@nestjs/testing": "^10.0.0",
      "@types/bcrypt": "^5.0.0",
      "@types/express": "^4.17.17",
      "@types/node": "^20.3.1",
      "@types/passport-jwt": "^3.0.8",
      "prisma": "^5.0.0",
      "typescript": "^5.1.3"
    }
  }
  ```

- [ ] **Step 2: Criar o tsconfig.json no backend**
  Escrever `backend/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "module": "commonjs",
      "declaration": true,
      "removeComments": true,
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "allowSyntheticDefaultImports": true,
      "target": "ES2021",
      "sourceMap": true,
      "outDir": "./dist",
      "baseUrl": "./",
      "incremental": true,
      "skipLibCheck": true,
      "strictNullChecks": false,
      "noImplicitAny": false,
      "strictBindCallApply": false,
      "forceConsistentCasingInFileNames": false,
      "noFallthroughCasesInSwitch": false
    }
  }
  ```

- [ ] **Step 3: Instalar as dependências do backend**
  Run: `npm install` dentro da pasta `backend/`.

- [ ] **Step 4: Criar o arquivo de schema do Prisma**
  Escrever `backend/prisma/schema.prisma` contendo os modelos `Tenant`, `Usuario`, `MembroCasa`, `Cartao`, `Fatura`, `Gasto`, `DivisaoGasto` e `ContaFixa` sem suporte offline.

- [ ] **Step 5: Implementar o PrismaService**
  Escrever `backend/src/prisma/prisma.service.ts`:
  ```typescript
  import { Injectable, OnModuleInit } from '@nestjs/common';
  import { PrismaClient } from '@prisma/client';

  @Injectable()
  export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
      await this.$connect();
    }
  }
  ```

- [ ] **Step 6: Implementar o PrismaModule**
  Escrever `backend/src/prisma/prisma.module.ts` para exportar o `PrismaService`.

- [ ] **Step 7: Commit do setup inicial**
  Run: `git add backend/` e commit.

---

### Task 2: Implementar Bootstrap Autônomo e Inicialização de Migrações (Main & AppModule)

**Files:**
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`

- [ ] **Step 1: Criar o AppModule**
  Escrever `backend/src/app.module.ts` importando o `PrismaModule`:
  ```typescript
  import { Module } from '@nestjs/common';
  import { PrismaModule } from './prisma/prisma.module';

  @Module({
    imports: [PrismaModule],
  })
  export class AppModule {}
  ```

- [ ] **Step 2: Criar o Bootstrap em main.ts com execução de migrations**
  Escrever `backend/src/main.ts` para rodar `execSync('npx prisma migrate deploy')` na inicialização do NestJS:
  ```typescript
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';
  import { execSync } from 'child_process';
  import { Logger } from '@nestjs/common';

  async function bootstrap() {
    const logger = new Logger('Bootstrap');

    try {
      logger.log('Iniciando verificação autônoma de migrações DDL...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      logger.log('Migrações DDL aplicadas/verificadas com sucesso!');
    } catch (error) {
      logger.error('Falha ao aplicar migrações DDL de forma autônoma:', error);
    }

    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(3000);
    logger.log('Servidor NestJS rodando na porta 3000');
  }
  bootstrap();
  ```

- [ ] **Step 3: Testar execução do backend**
  Run: `npm run start:dev` na pasta `backend/` com `DATABASE_URL` mockado ou configurado no `.env` do backend para garantir que não haja erros de inicialização.

- [ ] **Step 4: Commit**
  Run: `git add backend/src/main.ts backend/src/app.module.ts` e commit.

---

### Task 3: Implementar Módulo de Autenticação JWT

**Files:**
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Create: `backend/src/auth/jwt-auth.guard.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Implementar o AuthService**
  Criar a lógica de registro (`register`) e login (`login`) consultando e inserindo usuários no PostgreSQL via `PrismaService`, utilizando `bcrypt` para hash da senha e gerando o payload JWT.
- [ ] **Step 2: Implementar o AuthController**
  Expor as rotas HTTP POST `/auth/register` e POST `/auth/login`.
- [ ] **Step 3: Implementar o JwtAuthGuard**
  Implementar o Guard do Passport JWT para proteger rotas operacionais.
- [ ] **Step 4: Registrar o AuthModule no AppModule**
- [ ] **Step 5: Commit**
  Run: `git add backend/src/auth/` e commit.

---

### Task 4: Implementar Módulo Financeiro e Rotas de Negócio

**Files:**
- Create: `backend/src/financeiro/financeiro.service.ts`
- Create: `backend/src/financeiro/financeiro.controller.ts`
- Create: `backend/src/financeiro/financeiro.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Implementar o FinanceiroService**
  Implementar todos os métodos operacionais que antes rodavam no frontend: listagem/criação de membros, cartões, faturas, lançamentos de gastos, acertos e contas fixas, aplicando as regras de validação estrutural diretamente no banco de dados PostgreSQL.
- [ ] **Step 2: Implementar o FinanceiroController**
  Criar rotas HTTP GET/POST/DELETE sob `/financeiro/membros`, `/financeiro/cartoes`, `/financeiro/gastos`, `/financeiro/faturas`, `/financeiro/acertos` protegidas por `JwtAuthGuard` e que extraem o `tenantId` do cabeçalho `X-Tenant-ID`.
- [ ] **Step 3: Registrar o FinanceiroModule no AppModule**
- [ ] **Step 4: Commit**
  Run: `git add backend/src/financeiro/` e commit.

---

### Task 5: Desmembramento de Código Morto e Supabase no Frontend

**Files:**
- Modify: `package.json`
- Remove: `src/shared/supabase.ts`
- Remove: `src/shared/supabase.test.ts`
- Remove: `src/models/repositories/supabase/`
- Remove: `src/models/repositories/local/`
- Remove: `src/shared/utils/StorageLock.ts`
- Remove: `src/shared/utils/StorageLock.test.ts`
- Remove: `src/models/services/MigrationService.ts`
- Remove: `src/models/services/MigrationService.test.ts`

- [ ] **Step 1: Desinstalar @supabase/supabase-js**
  Run: `npm uninstall @supabase/supabase-js` na raiz do projeto.
- [ ] **Step 2: Excluir arquivos órfãos de concorrência e Supabase**
  Excluir `src/shared/supabase.ts`, `src/shared/supabase.test.ts`, `src/shared/utils/StorageLock.ts` e `StorageLock.test.ts`.
- [ ] **Step 3: Excluir repositórios de Supabase e Locais**
  Excluir as pastas `src/models/repositories/supabase/` e `src/models/repositories/local/`.
- [ ] **Step 4: Excluir serviço de migração obsoleto**
  Excluir `src/models/services/MigrationService.ts` e `src/models/services/MigrationService.test.ts`.
- [ ] **Step 5: Commit**
  Run: `git commit -am "cleanup: remove supabase client, local repositories and migration logic"`

---

### Task 6: Implementar os Repositórios HTTP no Frontend

**Files:**
- Create: `src/models/repositories/http/HttpBaseRepository.ts`
- Create: `src/models/repositories/http/HttpMembroRepository.ts`
- Create: `src/models/repositories/http/HttpCartaoRepository.ts`
- Create: `src/models/repositories/http/HttpFaturaRepository.ts`
- Create: `src/models/repositories/http/HttpGastoRepository.ts`
- Create: `src/models/repositories/http/HttpContaFixaRepository.ts`
- Create: `src/models/repositories/http/HttpAcertoMembroRepository.ts`
- Modify: `src/shared/container.ts`

- [ ] **Step 1: Criar a classe base HttpBaseRepository**
  Escrever `src/models/repositories/http/HttpBaseRepository.ts` implementando chamadas HTTP para o NestJS enviando o token JWT e o `X-Tenant-ID` no cabeçalho das requisições.
- [ ] **Step 2: Criar o HttpMembroRepository**
  Conectar as chamadas de membros à rota correspondente no NestJS.
- [ ] **Step 3: Criar o HttpCartaoRepository**
  Conectar as chamadas de cartões à rota correspondente no NestJS.
- [ ] **Step 4: Criar o HttpFaturaRepository**
  Conectar as chamadas de faturas à rota correspondente no NestJS.
- [ ] **Step 5: Criar o HttpGastoRepository**
  Conectar as chamadas de gastos à rota correspondente no NestJS.
- [ ] **Step 6: Criar o HttpContaFixaRepository**
  Conectar as chamadas de contas fixas à rota correspondente no NestJS.
- [ ] **Step 7: Criar o HttpAcertoMembroRepository**
  Conectar as chamadas de acertos à rota correspondente no NestJS.
- [ ] **Step 8: Atualizar container.ts**
  Remover imports órfãos e exportar diretamente as instâncias de repositórios HTTP, deletando o Proxy de persistência local/híbrido.
- [ ] **Step 9: Commit**
  Run: `git add src/models/repositories/http/ src/shared/container.ts` e commit.

---

### Task 7: Refatorar Autenticação e Views no Frontend

**Files:**
- Modify: `src/models/services/TenantSessionService.ts`
- Modify: `src/App.vue`
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Refatorar TenantSessionService**
  Adaptar o serviço para salvar o token JWT retornado no login e gerenciar a sessão localmente sem consultar o cliente Supabase.
- [ ] **Step 2: Limpar imports e dependências obsoletas no App.vue**
  Remover a importação de `migrationService`, `supabase` e `useStorageSync`, limpando também a chamada de validação inicial do Supabase.
- [ ] **Step 3: Limpar vite-env.d.ts**
  Remover as variáveis do Supabase do arquivo de tipos reativos.
- [ ] **Step 4: Commit**
  Run: `git commit -am "refactor: simplify tenant session and app.vue auth flows"`

---

### Task 8: Ajustar e Rodar os Testes Unitários do Frontend

**Files:**
- Modify: `src/viewmodels/useCasasMultitenant.test.ts`
- Modify: `src/viewmodels/useCartoesEFaturas.test.ts`
- Modify: `src/viewmodels/useMembros.test.ts`
- Modify: `src/viewmodels/useContasFixas.test.ts`
- Modify: `src/viewmodels/useNovoLancamentoWizard.test.ts`

- [ ] **Step 1: Mockar chamadas HTTP nos testes**
  Garantir que as chamadas `fetch` disparadas pelos repositórios HTTP sejam interceptadas e retornem dados válidos durante os testes unitários, permitindo testar as ViewModels isoladamente.
- [ ] **Step 2: Executar testes unitários do Frontend**
  Run: `npx vitest run`
  Expected: 100% PASS
- [ ] **Step 3: Validar Build de Produção**
  Run: `npm run build`
  Expected: Sucesso na compilação do Vite sem erros do compilador de TypeScript.
- [ ] **Step 4: Commit**
  Run: `git commit -am "test: mock http calls and ensure all front-end tests pass"`
