## Why

Atualmente, qualquer usuário da casa pode cadastrar um cartão de crédito no nome de outro morador (definindo o `responsavelPadraoId` livremente) e também excluir qualquer cartão da casa. Isso prejudica a segurança da informação e a fidelidade dos saldos pessoais. Além disso, o aplicativo carece de uma área dedicada ao Perfil do Usuário para exibir os detalhes do usuário logado e permitir ações básicas como logout.

## What Changes

- **Substituição do Botão de Ajustes:** O botão de engrenagem no cabeçalho (`DashboardHeader.vue`) será substituído pelo avatar do usuário logado.
- **Área de Perfil do Usuário:** Abertura de um Bottom Sheet redesenhado contendo duas abas principais:
  - **Meu Perfil:** Dados do usuário logado (nome, username, avatar), botão de logout e gerenciamento exclusivo de seus próprios cartões.
  - **Ajustes da Casa:** Contém o link de convite e a listagem de moradores (onde é possível adicionar e gerenciar a ativação de outros membros).
- **Restrição de Cadastro/Exclusão de Cartões:** O formulário de cadastro de cartão de crédito não exibirá mais o dropdown de "Responsável Principal"; o cartão será associado automaticamente ao morador correspondente ao usuário logado. Apenas cartões de propriedade do usuário ativo poderão ser excluídos por ele.
- **Preservação de Uso Compartilhado:** Outros membros da casa ainda poderão selecionar e associar despesas a qualquer cartão ativo na casa no wizard de lançamento.

## Capabilities

### New Capabilities

- `perfil-usuario-cartoes`: Gerenciamento do perfil pessoal do usuário, centralizando seus dados de acesso, controle de sessão (logout) e administração segura de seus cartões de crédito pessoais, garantindo que o vínculo do cartão seja feito automaticamente com seu respectivo perfil na casa ativa.

### Modified Capabilities

<!-- Nenhuma especificação existente modificada (repositório recém-inicializado) -->

## Impact

- **Modelos e Repositórios Frontend:** Atualização da entidade `Membro` e do `HttpMembroRepository` para carregar a propriedade `userId` vinda da API de membros.
- **Viewmodels:** Atualização de `useMembros` para expor o membro correspondente ao usuário logado (`currentMembro`).
- **Componentes e Telas de UI:**
  - `DashboardHeader.vue`: Troca do ícone e comportamento do botão de engrenagem.
  - `ConfiguracoesMembros.vue`: Substituição pela UI de Perfil do Usuário com abas.
  - `ConfiguracoesCartoes.vue`: Ajuste na listagem de cartões para limitar a exclusão/criação ao usuário autenticado.
