## Why

Atualmente, o usuário logado consegue visualizar suas informações pessoais (como avatar, nome de exibição e nome de usuário) e seus cartões de crédito na aba "Meu Perfil", mas não tem a capacidade de alterar o seu próprio nome de exibição diretamente na interface. Isso gera dependência de outros administradores ou de intervenções manuais no banco de dados para simples correções de digitação ou mudanças de nome.

## What Changes

- **Edição Inline de Perfil**: Permitir que o usuário logado edite seu nome de exibição diretamente no card de perfil pessoal, com um modo de edição acionado por um botão de lápis (inline).
- **Salvamento e Validação**: O campo de edição terá ações rápidas de confirmação (✓) e cancelamento (✗), validação para impedir nomes vazios, estado visual de carregamento (loading) e exibição de toast de feedback.
- **Sincronização**: Ao salvar a alteração com sucesso, o nome do membro correspondente será atualizado em toda a aplicação (inclusive em cabeçalhos, listagens de moradores e outros lugares que usem o estado reativo do membro logado).

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->

### Modified Capabilities
- `perfil-usuario-cartoes`: Atualizar o requisito de exibição do perfil para incluir a possibilidade de edição inline do nome de exibição do usuário logado, integrando-o à persistência do repositório de membros.

## Impact

- **Frontend**:
  - `src/views/screens/ConfiguracoesMembros.vue` (Adição do estado de edição inline e integração de salvamento)
  - `src/viewmodels/useMembros.ts` (Implementação e exportação de `atualizarNomeMembro`)
  - Testes do viewmodel (`src/viewmodels/useMembros.test.ts`) e da view (`src/views/screens/ConfiguracoesMembros.test.ts`)
- **Backend / Services**:
  - `src/models/services/MembroService.ts` (Implementação do método `atualizarNomeMembro`)
  - Testes do serviço (`src/models/services/MembroService.test.ts`)
