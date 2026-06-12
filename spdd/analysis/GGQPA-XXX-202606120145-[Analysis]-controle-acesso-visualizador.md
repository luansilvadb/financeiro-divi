# SPDD Analysis: Alinhamento e Iteração do Controle de Acesso do Visualizador (RBAC)

## Original Business Requirement

> /spdd-analysis itere controle de acessodo visualizador quero saber melhor pra mim não tem diferença nenhuma

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Visualizador (Role.VISUALIZADOR)**: Papel sistêmico de somente leitura do DIVI. Pode realizar requisições `GET` a dados financeiros da moradia, mas é barrado pelo `TenantRoleGuard` em requisições de escrita (`POST`, `DELETE`).
- **Morador (Role.MORADOR)**: Papel sistêmico operacional. Possui privilégios totais de leitura e escrita financeira.
- **TenantSessionService**: Serviço responsável pelo estado da sessão de moradias.
- **useMembros (ViewModel)**: ViewModel que expõe o `currentMembro`, permitindo ao frontend saber qual a Role do usuário atualmente ativo.
- **Componentes Operacionais Financeiros**: Elementos de UI que realizam mutação de dados (BottomTabBar, ActivityFeed, ContasFixasPanel, NettingPanel, ConfiguracoesCartoes).

### New Concepts Required

- **Nenhum**. O objetivo desta análise é alinhar o frontend com o comportamento de segurança existente no backend para a Role `VISUALIZADOR`.

### Key Business Rules

- **Privilégio Estrito de Leitura**: O `VISUALIZADOR` não pode criar, editar ou excluir gastos, cartões, faturas ou contas fixas.
- **Feedback Preventivo de UX**: O aplicativo não deve exibir botões ou controles interativos que resultem em erro de autorização no servidor (como erros 403 Forbidden). A UI deve desativar ou ocultar esses elementos proativamente com base na Role do usuário ativo.

---

## Strategic Approach

### Solution Direction

A crítica do usuário é cirúrgica: **"pra mim não tem diferença nenhuma"**. Atualmente, embora o backend bloqueie com sucesso as ações do `VISUALIZADOR` usando o `TenantRoleGuard`, o frontend trata o Visualizador de maneira idêntica a um Morador comum:
- Mostra o botão de "+" para lançar despesas.
- Mostra botões de "Ajustar" e "Estornar" em despesas registradas.
- Mostra opções de cadastrar e remover cartões de crédito.
- Mostra opções de criar e lançar contas fixas.

Quando um usuário `VISUALIZADOR` clica em qualquer uma dessas ações, a UI deixa que ele prossiga e envie a requisição, apenas para exibir um toast genérico de erro vindo do backend (403 Forbidden). Isso causa uma péssima experiência de uso e a percepção de que a role de "Visualizador" não tem utilidade prática de segurança visível ou está "quebrada".

Para validar as premissas centrais e agregar valor real à feature:
1. **O Visualizador tem utilidade no DIVI?** Sim, para convidados observadores (como fiadores, contadores ou pais financiadores de repúblicas que pagam as despesas mas não moram e nem lançam contas ativamente).
2. **Como sanar o descolamento de UX?** Devemos integrar a checagem de Role no frontend. Usando a propriedade `currentMembro.value?.role` exposta pelo ViewModel `useMembros`, passaremos uma flag `isReadOnly` aos componentes operacionais para desativar e ocultar as ações de alteração financeira.

---

### Key Design Decisions

#### Decisão 1: Ocultar o botão de Novo Lançamento (FAB) do menu principal
- **Estratégia**: Acessar o `currentMembro` no `App.vue` e passar a propriedade `isReadOnly = (currentMembro?.role === 'VISUALIZADOR')` para o componente `BottomTabBar.vue`.
- **Efeito na UI**: Desabilitar e estilizar de forma opaca (disabled) o botão central de "+" na barra de navegação inferior.

#### Decisão 2: Ocultar opções de Ajuste e Estorno nas Despesas
- **Estratégia**: Passar a flag `isReadOnly` para o componente `ActivityFeed.vue`.
- **Efeito na UI**: A div que contém os botões "Ajustar" (editar) e "Estornar" (excluir) não será renderizada no feed para visualizadores.

#### Decisão 3: Desativar Painel de Contas Fixas e Registrar Netting
- **Estratégia**: Ocultar botões de "+ Adicionar Nova Conta" no `ContasFixasPanel.vue` e desativar interações de toque (pointerdown/pointerup) e o cursor clicável no `ContasFixasCard.vue` para visualizadores.
- **Efeito no Netting**: Desabilitar/ocultar o botão "Registrar Pagamento" no `NettingPanel.vue`.

#### Decisão 4: Ocultar Gerenciamento de Cartões de Crédito no Perfil
- **Estratégia**: No `ConfiguracoesCartoes.vue`, ocultar o botão "Novo Cartão" e o ícone de lixeira (excluir) para visualizadores.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **Visualizador em grupos pequenos (Casal)**: Em moradias de duas pessoas, a Role de Visualizador raramente será usada. O aplicativo deve deixar claro na UI de gerenciamento de membros (aba Acessos) o propósito de cada Role para evitar que o Admin atribua a role errada por acidente.

### Edge Cases

- **Membro sem sessão ativa de moradia**: Se `currentMembro` for indefinido (ex: no fluxo de onboarding ou transição), a flag `isReadOnly` deve assumir `false` para não quebrar a navegação global.
- **Atualização em tempo real de Role**: Se o Admin promover um Visualizador para Morador enquanto ele está com o app aberto, o socket receberá o evento `membros_alterados` e re-renderizará a tela, ativando os botões instantaneamente sem precisar deslogar.

### Technical Risks

- **Sobrecarga de props**: Será necessário passar a propriedade `isReadOnly` (ou diretamente a Role do membro ativo) de `App.vue` para `DashboardSaldos.vue` e deste para os subcomponentes. Isso é tolerável e fácil de cobrir com TypeScript.

### Acceptance Criteria Coverage

| AC# | Descrição do Problema / Lacuna | Proposta de Solução / Alinhamento | Status | Notas |
|-----|--------------------------------|----------------------------------|--------|-------|
| 1 | Visualizador parece idêntico a Morador | **Resolvido**: Introdução de flags preventivas de leitura no frontend (`isReadOnly`) baseadas na role do usuário logado. | Sim | Alinha a experiência com a governança real do backend. |
| 2 | Botão de "+" (FAB) operável por Visualizador | **Ajustado**: O botão central do BottomTabBar será desabilitado visualmente para a role `VISUALIZADOR`. | Sim | Evita abertura de formulários de escrita inúteis. |
| 3 | Feed de despesas exibe ações de escrita | **Ajustado**: Botões de Ajustar e Estornar não serão renderizados para Visualizador. | Sim | Garante visualização estritamente de leitura do extrato. |
| 4 | Contas fixas e Netting permitem cliques operacionais | **Ajustado**: Desativação de toques e botões de registro em Contas Fixas e compensações de netting. | Sim | Trava as interações mutadoras adicionais. |
| 5 | Cartões pessoais editáveis no menu de perfil | **Ajustado**: Ocultar criação e remoção de cartões para visualizadores. | Sim | Protege a infraestrutura de cartões. |
