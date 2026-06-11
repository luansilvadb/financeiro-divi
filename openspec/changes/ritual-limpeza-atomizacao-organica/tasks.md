## 1. Refatoração de Backend (NestJS)

- [x] 1.1 Criar `MembroService` e extrair lógica de gestão de membros do `FinanceiroService`
- [x] 1.2 Criar `CargoService` e extrair lógica de cargos e permissões do `FinanceiroService`
- [x] 1.3 Criar `CartaoService` e extrair lógica de cartões e faturas do `FinanceiroService`
- [x] 1.4 Criar `LancamentoService` (backend) e extrair lógica de gastos do `FinanceiroService`
- [x] 1.5 Atualizar `FinanceiroController` para delegar chamadas aos novos serviços específicos
- [x] 1.6 Garantir que o `FinanceiroGateway` continue sendo notificado corretamente em todos os novos serviços

## 2. Atomização de UI (Frontend)

- [x] 2.1 Criar diretório `src/views/components/settings/`
- [x] 2.2 Extrair `PerfilUsuarioTab.vue` de `ConfiguracoesMembros.vue`
- [x] 2.3 Extrair `GestaoAcessoTab.vue` de `ConfiguracoesMembros.vue`
- [x] 2.4 Extrair `GestaoCargosTab.vue` de `ConfiguracoesMembros.vue`
- [x] 2.5 Refatorar `ConfiguracoesMembros.vue` para ser apenas um container de abas utilizando os novos componentes
- [x] 2.6 Remover o botão/modal de "Ajuste de Netting" (registro de acerto) do Dashboard e do `useDashboardViewModel.ts`

## 3. Saneamento de Testes e Código Morto

- [x] 3.1 Corrigir `backend/src/security.spec.ts` para usar o prefixo `/api` e setup correto da aplicação
- [x] 3.2 Atualizar mocks de log em `src/models/services/TenantSessionService.test.ts` para coincidir com o formato do `logger.ts`
- [x] 3.3 Remover código não utilizado em `GastoService.ts` relacionado ao registro manual de netting

## 4. Validação e Finalização

- [x] 4.1 Executar testes de backend: `pnpm --filter divi-backend run test`
- [x] 4.2 Executar testes de frontend: `npx vitest run`
- [x] 4.3 Realizar build completo do projeto para garantir integridade: `npm run build`
