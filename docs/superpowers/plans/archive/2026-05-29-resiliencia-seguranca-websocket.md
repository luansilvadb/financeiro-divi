# Plano de Implementação: Resiliência e Segurança do WebSocket

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar autenticação, autorização por tenant e resiliência de listeners no fluxo de WebSockets.

**Architecture:** O NestJS Gateway agora valida o token JWT usando o AuthService e verifica a participação do usuário logado na tabela membroCasa (Prisma) antes de associá-lo a uma sala. O frontend evita listeners duplicados e lê o token atualizado na reconexão.

**Tech Stack:** NestJS (@nestjs/websockets), Prisma, Vue 3, socket.io-client.

---

### Task 1: Adicionar validação de token no AuthService do Backend

**Files:**
- Modify: `d:/projetos/divi/backend/src/auth/auth.service.ts`

- [ ] **Step 1: Adicionar o método validarToken no auth.service.ts**

Adicionar após o método `login` o seguinte código:
```typescript
  validarToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      return null;
    }
  }
```

- [ ] **Step 2: Verificar se o backend compila sem erros**

Executar no diretório `backend`: `npm run build`
Esperado: Compilação concluída com sucesso.

---

### Task 2: Implementar segurança e try/catch no FinanceiroGateway do Backend

**Files:**
- Modify: `d:/projetos/divi/backend/src/financeiro/financeiro.gateway.ts`

- [ ] **Step 1: Injetar dependências no FinanceiroGateway**

Atualizar imports e injetar `AuthService` e `PrismaService` no construtor.
Imports a adicionar/verificar:
```typescript
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
```

Construtor a adicionar:
```typescript
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}
```

- [ ] **Step 2: Atualizar handleJoinTenant no FinanceiroGateway**

Substituir o método `handleJoinTenant` para validar o token JWT e verificar a associação do usuário com o `tenantId` no banco, tratando exceções de UUID inválido com `try/catch`.

```typescript
  @SubscribeMessage('joinTenant')
  async handleJoinTenant(
    @MessageBody() data: { tenantId: string; token?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tenantId, token } = data;
    if (!tenantId) {
      return { status: 'error', message: 'tenantId is required' };
    }
    if (!token) {
      return { status: 'error', message: 'token is required' };
    }

    const decoded = this.authService.validarToken(token);
    if (!decoded || !decoded.sub) {
      this.logger.warn(`Cliente ${client.id} tentou registrar-se no tenant com token inválido.`);
      return { status: 'error', message: 'Invalid or expired token' };
    }

    try {
      const membro = await this.prisma.membroCasa.findFirst({
        where: {
          tenantId,
          userId: decoded.sub,
        },
      });

      if (!membro) {
        this.logger.warn(`Usuário ${decoded.username} (${decoded.sub}) tentou acessar tenant ${tenantId} sem pertencer a ele.`);
        return { status: 'error', message: 'Access denied to this tenant' };
      }

      client.join(tenantId);
      this.logger.log(`Cliente ${client.id} (usuário: ${decoded.username}) entrou na sala do tenant: ${tenantId}`);
      return { status: 'success', room: tenantId };
    } catch (dbError) {
      this.logger.error(`Erro ao validar acesso do usuário ${decoded.sub} ao tenant ${tenantId}:`, dbError);
      return { status: 'error', message: 'Invalid tenantId format or database error' };
    }
  }
```

- [ ] **Step 3: Verificar compilação do NestJS**

Executar no diretório `backend`: `npm run build`
Esperado: Compilação concluída com sucesso.

---

### Task 3: Atualizar SocketService no Frontend para Robustez e Envio de Token

**Files:**
- Modify: `d:/projetos/divi/src/models/services/SocketService.ts`

- [ ] **Step 1: Evitar listeners duplicados no SocketService**

Modificar o método `on(event, callback)` para desregistrar o listener do evento antes de adicionar o novo:
```typescript
  on(event: string, callback: (payload?: any) => void): void {
    if (this.socket) {
      this.socket.off(event)
      this.socket.on(event, callback)
    } else {
      console.warn(`[SocketService] Tentou registrar evento "${event}" sem socket conectado.`)
    }
  }
```

- [ ] **Step 2: Ler token atualizado no evento connect do SocketService**

Modificar a conexão no método `conectar(tenantId)` para ler o token do localStorage no momento em que conectar e passar o token no payload de `joinTenant`:
```typescript
    this.socket.on('connect', () => {
      const token = localStorage.getItem('divi_jwt_token')
      console.log(`[SocketService] Conectado. Enviando joinTenant para ${tenantId}`)
      this.socket?.emit('joinTenant', { tenantId, token }, (res: any) => {
        console.log('[SocketService] Resposta do joinTenant:', res)
      })
    })
```

---

### Task 4: Validação dos Testes Unitários no Frontend

**Files:**
- Test: `d:/projetos/divi` (vitest suite)

- [ ] **Step 1: Rodar os testes do Vitest no frontend**

Executar no diretório `d:/projetos/divi`: `npx vitest run`
Esperado: Todos os 241 testes unitários passando.
