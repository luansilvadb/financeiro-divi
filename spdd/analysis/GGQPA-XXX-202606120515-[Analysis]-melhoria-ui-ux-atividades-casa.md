# SPDD Analysis: GGQPA-XXX-202606120515-[Analysis]-melhoria-ui-ux-atividades-casa

## Original Business Requirement
melhore ui ux 'atividades da casa' modal está muito duro nem animação hamonico com design do app

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **AuditLog**: Registro de auditoria contábil da casa. Contém a ação realizada, detalhes, autor (membroId) e data.
- **DashboardViewModel**: Responsável por fornecer os dados e ações para o dashboard, incluindo a listagem de logs de auditoria (`listarAuditLogs`).
- **BottomSheet**: Componente de interface padrão do aplicativo para modais deslizantes, com animações de mola (spring) e suporte a arraste.
- **DashboardModalsManager**: Gerenciador centralizado de modais do dashboard.

#### New Concepts Required
- **BottomSheetAuditLogs**: Novo componente especializado para exibir os logs de auditoria, seguindo o padrão de design do sistema.

#### Key Business Rules
- **Controle de Acesso**: A exibição dos logs deve respeitar a permissão `ALLOW_VER_AUDIT_LOGS`.
- **Identificação visual**: As ações de auditoria (CRIAR, EDITAR, EXCLUIR, ALTERAR_RENDA) devem possuir dicas visuais (ícones/cores) consistentes.

## Strategic Approach

#### Solution Direction
- **Refatoração para Componente Próprio**: Extrair a implementação "hardcoded" do modal de `DashboardSaldos.vue` para um novo componente `BottomSheetAuditLogs.vue`.
- **Padronização de UI**: Utilizar o componente base `BottomSheet.vue` para garantir que as animações, sombras e comportamento de fechamento sejam idênticos aos outros modais do app.
- **Integração no ModalsManager**: Adicionar o novo modal ao `DashboardModalsManager.vue`, centralizando o controle de visibilidade.
- **Polimento Visual**: Melhorar o estado de carregamento e lista vazia para usar os padrões estéticos definidos no projeto (ex: `IllustrationMascot`).

#### Key Design Decisions
- **Uso de Teleport**: O `BottomSheet` já utiliza `Teleport` para o body, resolvendo problemas de empilhamento de Z-index que o modal atual poderia ter.
- **Manutenção de Estado**: O estado de visibilidade e os dados dos logs continuarão sendo gerenciados pelo `DashboardViewModel` e injetados via props, mantendo a consistência com o padrão MVVM do projeto.

#### Alternatives Considered
- **Apenas ajustar o CSS no DashboardSaldos**: Rejeitado pois mantém o código inflado e não reaproveita o comportamento complexo de drag-to-close do `BottomSheet`.

## Risk & Gap Analysis

#### Requirement Ambiguities
- O termo "harmônico" é subjetivo, mas no contexto deste app, refere-se ao uso de bordas arredondadas (32px), animações spring (`--ease-spring`) e tipografia `font-display`.

#### Edge Cases
- **Volume de Dados**: Muitos logs podem causar lentidão se não forem paginados, mas para o escopo atual (histórico recente), a rolagem simples no modal é suficiente.
- **Nomes de Membros**: Garantir que o `getMembroNome` funcione corretamente dentro do novo componente.

#### Technical Risks
- Nenhum risco técnico significativo identificado, pois é uma refatoração de UI puramente estética e estrutural.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Utilizar o componente `BottomSheet` para animações fluidas | Sim | Padrão do projeto. |
| 2 | Separar lógica em componente dedicado | Sim | Melhora manutenibilidade. |
| 3 | Melhorar estados de Loading e Empty | Sim | Usando componentes UI existentes. |
| 4 | Manter consistência de cores por tipo de ação | Sim | Mapear `acao` para estilos. |
