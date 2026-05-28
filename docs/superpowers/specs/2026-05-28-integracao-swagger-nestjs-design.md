# Especificação de Design - Integração com Swagger (NestJS)

Esta especificação descreve a implementação de documentação interativa da API do DIVI usando Swagger (OpenAPI) no backend NestJS na rota `/api`, com mapeamento automático de DTOs e suporte a autenticação JWT.

## 1. Visão Geral
Para simplificar o desenvolvimento e permitir que as rotas da API sejam testadas de forma interativa, integraremos o Swagger UI na rota `/api`. Usaremos o plugin CLI do NestJS para evitar decoradores repetitivos nas classes DTO e configuraremos o suporte para Bearer Authentication (JWT).

## 2. Configuração de Infraestrutura

### 2.1. Instalação de Dependências
Serão adicionados os seguintes pacotes ao `backend/package.json`:
* `@nestjs/swagger` (geração de especificação OpenAPI)
* `swagger-ui-express` (renderizador da interface web do Swagger)

### 2.2. Plugin do CLI (`backend/nest-cli.json`)
O plugin do Swagger extrairá automaticamente os tipos do TypeScript e documentará os DTOs do projeto. O arquivo `backend/nest-cli.json` será atualizado para:

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

---

## 3. Inicialização e Bootstrap (`backend/src/main.ts`)

O Swagger será configurado e montado na rota `/api` usando as classes `DocumentBuilder` e `SwaggerModule`.

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Adicionado no bootstrap() do main.ts:
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
```

---

## 4. Decoração dos Controladores

Utilizaremos decorações mínimas para agrupar e proteger as rotas da API.

### 4.1. AuthController (`backend/src/auth/auth.controller.ts`)
- Decorado com `@ApiTags('Autenticação')` para agrupar as rotas `/auth/*` sob uma seção específica na UI.

### 4.2. FinanceiroController (`backend/src/financeiro/financeiro.controller.ts`)
- Decorado com `@ApiTags('Financeiro')` para agrupar as rotas `/financeiro/*`.
- Decorado com `@ApiBearerAuth('JWT-auth')` no nível da classe para indicar que todos os endpoints desse controller exigem autorização via JWT.

---

## 5. Plano de Verificação

### 5.1. Compilação e Inicialização
- Rodar o build do backend (`npm run build` na pasta `backend/`) para verificar que o plugin do CLI gera os arquivos sem erros.
- Iniciar o servidor (`npm run start:dev` na pasta `backend/`).

### 5.2. Verificação Manual
- Acessar `http://localhost:3000/api` no navegador e validar se a interface do Swagger UI carrega normalmente.
- Validar se o botão "Authorize" está presente no canto superior direito.
- Testar a rota de login (`/auth/login`), copiar o token gerado, autenticar-se no Swagger UI clicando em "Authorize", e validar se uma rota protegida (ex: `/financeiro/membros`) pode ser executada com sucesso de dentro do painel interativo.
