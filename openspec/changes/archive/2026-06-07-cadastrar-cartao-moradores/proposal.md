## Why

Atualmente, o Divi possui o componente de gerenciamento de cartões pessoais (`ConfiguracoesCartoes.vue`), mas ele não está integrado na navegação ou na tela de configurações. Como resultado, os moradores não conseguem cadastrar ou remover seus próprios cartões de crédito no sistema, impedindo que utilizem o fluxo de lançamento de despesas por cartão.

## What Changes

- Integração do componente de gerenciamento de cartões (`ConfiguracoesCartoes.vue`) dentro da tela de configurações de moradores (`ConfiguracoesMembros.vue`).
- Atualização da suíte de testes unitários para dar suporte à nova estrutura sem quebras de ambiente ou regressões.

## Capabilities

### New Capabilities

*(Nenhuma nova capacidade é necessária, pois a estrutura de cartões e faturas já está modelada)*

### Modified Capabilities

- `perfil-usuario-cartoes`: Integração e exibição do gerenciamento de cartões próprios (cadastro e exclusão) dentro do fluxo de configurações de moradores.

## Impact

- **Frontend:**
  - `src/views/screens/ConfiguracoesMembros.vue`: Importação e inserção do componente `ConfiguracoesCartoes.vue` em seu template.
  - `src/views/screens/ConfiguracoesMembros.test.ts`: Ajuste nos mocks e stubs de teste para garantir a integridade da suite de testes do Vitest.
- **Backend e Banco de Dados:**
  - Sem impacto (as APIs de cartões e persistência de dados no PostgreSQL via Prisma já estão ativas e implementadas).
