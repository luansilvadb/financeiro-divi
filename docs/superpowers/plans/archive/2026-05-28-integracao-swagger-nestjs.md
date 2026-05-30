# Plano de Implementação - Integração com Swagger (NestJS)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar o Swagger UI (OpenAPI) ao backend NestJS exposto na rota `/api`, habilitando a documentação interativa das rotas e suporte para autenticação via JWT.

**Architecture:** Usaremos o plugin do CLI `@nestjs/swagger` para autogerar a documentação de DTOs e tipagens TypeScript sem decoradores de propriedade redundantes, configurando o SwaggerModule no bootstrap do NestJS e decorando pontualmente os controladores com tags e segurança.

**Tech Stack:** NestJS, TypeScript, `@nestjs/swagger`, `swagger-ui-express`

---

### Task 1: Instalar Dependências e Configurar o CLI Plugin

**Files:**
- Modify: [package.json](file:///c:/teste/financeiro-divi/backend/package.json)
- Modify: [nest-cli.json](file:///c:/teste/financeiro-divi/backend/nest-cli.json)

- [ ] **Step 1: Instalar os pacotes necessários na pasta backend**

Run: `npm install @nestjs/swagger swagger-ui-express` na pasta `backend/`.
Expected: Instalação bem-sucedida e adição das dependências no package.json.

- [ ] **Step 2: Configurar o plugin do Swagger no nest-cli.json**

Modificar o arquivo `nest-cli.json` para incluir o array de plugins no `compilerOptions`.

Substituir o conteúdo do [nest-cli.json](file:///c:/teste/financeiro-divi/backend/nest-cli.json) por:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": ["@nestjs/swagger"]
  }
}
```

- [ ] **Step 3: Validar que o build do backend funciona**

Run: `npm run build` na pasta `backend/`.
Expected: O build do NestJS completa com sucesso gerando a pasta `dist/` e aplicando as transformações de tipos do plugin.

- [ ] **Step 4: Commit das alterações de configuração**

```bash
git add backend/package.json backend/package-lock.json backend/nest-cli.json
git commit -m "chore: instalar dependências do swagger e configurar plugin no nest-cli.json"
```

---

### Task 2: Integrar o Swagger no Bootstrap (`main.ts`)

**Files:**
- Modify: [main.ts](file:///c:/teste/financeiro-divi/backend/src/main.ts)

- [ ] **Step 1: Adicionar a configuração do SwaggerModule no bootstrap**

Modificar o arquivo `backend/src/main.ts` para importar as classes do Swagger e configurar a rota `/api`.

Substituir o conteúdo de [main.ts](file:///c:/teste/financeiro-divi/backend/src/main.ts) por:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Carrega as variáveis de ambiente do arquivo .env de forma autônoma para o process.env do Node
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIdx = trimmed.indexOf('=');
    if (separatorIdx > 0) {
      const key = trimmed.substring(0, separatorIdx).trim();
      let val = trimmed.substring(separatorIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Executa migrações automáticas pendentes antes de iniciar o app
  try {
    logger.log('Iniciando verificação autônoma de migrações DDL...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.log('Migrações DDL aplicadas/verificadas com sucesso!');
  } catch (error) {
    logger.error('Falha ao aplicar migrações DDL de forma autônoma:', error);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Configuração da documentação interativa Swagger (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('DIVI API')
    .setDescription('API do Gerenciador Financeiro DIVI (NestJS + PostgreSQL)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT gerado no login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  logger.log('Servidor NestJS rodando na porta 3000');
}
bootstrap();
```

- [ ] **Step 2: Verificar a compilação do main.ts**

Run: `npm run build` na pasta `backend/`.
Expected: Compilação de produção finaliza com sucesso sem erros do TypeScript.

- [ ] **Step 3: Commit das alterações do main.ts**

```bash
git add backend/src/main.ts
git commit -m "feat: inicializar SwaggerModule na rota /api no bootstrap do main.ts"
```

---

### Task 3: Decorar os Controladores de Autenticação e Financeiro

**Files:**
- Modify: [auth.controller.ts](file:///c:/teste/financeiro-divi/backend/src/auth/auth.controller.ts)
- Modify: [financeiro.controller.ts](file:///c:/teste/financeiro-divi/backend/src/financeiro/financeiro.controller.ts)

- [ ] **Step 1: Adicionar decorador de tags no AuthController**

Modificar [auth.controller.ts](file:///c:/teste/financeiro-divi/backend/src/auth/auth.controller.ts) para importar `ApiTags` e aplicá-lo na classe.

Modificar a classe aplicando o decorator no topo:
```typescript
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  // ... resto do código inalterado
```

- [ ] **Step 2: Adicionar tags e segurança no FinanceiroController**

Modificar [financeiro.controller.ts](file:///c:/teste/financeiro-divi/backend/src/financeiro/financeiro.controller.ts) para importar `ApiTags` e `ApiBearerAuth` e aplicá-los na classe.

Modificar a classe aplicando os decorators no topo:
```typescript
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Financeiro')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceiroController {
  // ... resto do código inalterado
```

- [ ] **Step 3: Validar a compilação geral do backend**

Run: `npm run build` na pasta `backend/`.
Expected: O build completa 100% de forma limpa.

- [ ] **Step 4: Commit final da decoração dos controllers**

```bash
git add backend/src/auth/auth.controller.ts backend/src/financeiro/financeiro.controller.ts
git commit -m "feat: agrupar endpoints e configurar autenticação Bearer no AuthController e FinanceiroController"
```

---

### Task 4: Validação Funcional do Swagger UI

- [ ] **Step 1: Iniciar o backend no modo de desenvolvimento**

Run: `npm run start:dev` na pasta `backend/`.
Expected: O servidor inicia normalmente e exibe a mensagem de sucesso rodando na porta 3000.

- [ ] **Step 2: Acessar a interface do Swagger no navegador**

Acesse `http://localhost:3000/api` no seu navegador de internet.
Expected: Carrega a interface visual do Swagger UI exibindo as seções "Autenticação" e "Financeiro", com a lista completa de rotas expostas.

- [ ] **Step 3: Testar fluxo de autenticação JWT**
1. No Swagger UI, abra o endpoint `POST /auth/login` sob a seção "Autenticação", clique em "Try it out", preencha com credenciais válidas e clique em "Execute".
2. Copie o token retornado no campo `access_token` do JSON de resposta.
3. Clique no botão "Authorize" (cadeado) no canto superior direito do painel, cole o token no campo correspondente e confirme.
4. Abra o endpoint `GET /financeiro/membros` sob "Financeiro", clique em "Try it out" e "Execute".
Expected: O endpoint executa com sucesso e retorna a lista de membros cadastrados com status HTTP 200, demonstrando que a autenticação Bearer JWT está configurada e sendo injetada corretamente no Swagger.
