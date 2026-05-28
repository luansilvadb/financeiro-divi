# Design Spec - Extração da Lógica Multitenant do Supabase

**Data:** 2026-05-28  
**Autor:** Antigravity (Google DeepMind)

## Contexto e Objetivo

O componente `DashboardSaldos.vue` contém mais de 1000 linhas de código. Uma parcela significativa desse código (~160 linhas) é dedicada à integração direta com o Supabase e com o `tenantSessionService` para a funcionalidade SaaS de "Casas" (Tenants), incluindo a listagem, criação, seleção de casas e a entrada por código de convite.

De acordo com o **GEMINI.md** (Invariante I: Domain Purity e Invariante III: MVVM), a lógica de rede/banco e fluxos de infraestrutura devem ser isolados da camada de View. O objetivo deste design é extrair essa lógica para um Hook reutilizável `useCasasMultitenant.ts` e testá-lo isoladamente.

## Abordagem Proposta

### 1. Criação do Hook `useCasasMultitenant.ts`

Local: `src/viewmodels/useCasasMultitenant.ts`

Esse hook irá expor:
- **Estados Reativos (Refs):**
  - `isAuthed`: se o usuário está logado.
  - `activeTenantId`: ID da casa ativa.
  - `casas`: array com todas as casas que o usuário faz parte.
  - `showBottomSheetCasas`: controle de visibilidade do bottom sheet.
  - `nomeNovaCasa`: string para criação de nova casa.
  - `codigoConvite`: string para entrada via código.
  - `errorCasa`: mensagem de erro de validação/rede.
  - `copied`: feedback visual ao copiar o código de convite.
- **Computed Properties:**
  - `activeTenantObj`: retorna o objeto de casa ativo a partir do array `casas`.
- **Métodos (Ações):**
  - `carregarCasas()`
  - `selecionarCasa(id: string)`
  - `criarNovaCasa()`
  - `entrarPorCodigo()`
  - `copyInviteCode(code: string)`
  - `handleLogoutClick()`
- **Lifecycle Hook (`onMounted`):**
  - Carrega as casas do usuário caso ele esteja autenticado.

### 2. Suíte de Testes `useCasasMultitenant.test.ts`

Local: `src/viewmodels/useCasasMultitenant.test.ts`

Testará os fluxos de:
- Carregamento de casas quando autenticado.
- Tentativa de entrada por código de convite (mockando o Supabase).
- Criação de nova casa (mockando o Supabase).
- Cópia do código de convite para a área de transferência.
- Logout e recarregamento da página.

### 3. Ajustes no `DashboardSaldos.vue`

Local: `src/views/screens/DashboardSaldos.vue`

Substituir todas as declarações de estado, métodos de rede e imports de ícones/serviços que foram delegados ao hook por um único consumo:
```typescript
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'

const {
  isAuthed,
  activeTenantId,
  casas,
  showBottomSheetCasas,
  nomeNovaCasa,
  codigoConvite,
  errorCasa,
  copied,
  activeTenantObj,
  selecionarCasa,
  criarNovaCasa,
  entrarPorCodigo,
  copyInviteCode,
  handleLogoutClick
} = useCasasMultitenant()
```

## Impacto nos Testes e Build

A alteração deve manter todos os testes unitários passando (`npx vitest run`) e a compilação do Vite funcionando perfeitamente (`npm run build`).

---
