# SPDD Analysis: Melhoria de Nomenclaturas e Acessibilidade da Navegação Inferior para Idosos

## Original Business Requirement
preciso melhorar mais as nomeclaturas de textos ui ux para os usuarios ter melhor clareza da jornada do usuario, está me incomodando alguns nomes das rotas do bottomnavbar pois não ta trazendo a intenção intuitiva da tela, quero facilitar entendimento para idosos.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **BottomTabBar**: Componente de barra de navegação inferior flutuante ([BottomTabBar.vue](file:///d:/projetos/financeiro-divi/src/views/components/ui/BottomTabBar.vue)).
- **Tab**: Tipo que define os IDs técnicos das abas: `'casas' | 'hoje' | 'faturas' | 'perfil'` ([BottomTabBar.vue](file:///d:/projetos/financeiro-divi/src/views/components/ui/BottomTabBar.vue#L7)).
- **App.vue**: Componente raiz que consome a `BottomTabBar` e gerencia a alternância de telas principais através do manipulador `handleTabChange` ([App.vue](file:///d:/projetos/financeiro-divi/src/App.vue#L75-L83)).

### New Concepts Required
- **FriendlyNavigationLabel**: Rótulos descritivos e simples focados no cotidiano e na compreensão cognitiva de pessoas idosas, evitando termos técnicos ou ambíguos.
- **AccessibleTextScaling**: Aumento do tamanho do texto (de `text-[9px]` com caixa alta para `text-[11px]` ou `text-xs` com capitalização normal) e aumento do contraste da cor do texto (de `text-graphite/60` para `text-graphite/85` nos estados inativos).
- **IntuitiveNavigationIcons**: Substituição de ícones abstratos ou corporativos por ícones de correspondência visual direta à funcionalidade real (ex: trocar `Calendar` por `Home`, e `CreditCard` por `Coins`).

### Key Business Rules
- **Acessibilidade para Idosos (Usabilidade)**:
  - **Legibilidade de Fontes**: Evitar fontes menores do que `11px` para rótulos secundários, e de preferência manter próximo de `12px` (ou `text-xs`) sempre que o espaço físico permitir.
  - **Casing Legível**: Evitar o uso generalizado de caixa alta (`uppercase`) em rótulos pequenos, pois reduz o reconhecimento de formas das palavras por idosos.
  - **Contraste de Acessibilidade**: Cores de texto devem respeitar o contraste de acessibilidade WCAG AA (mínimo de 4.5:1 para textos pequenos). O uso de opacidade baixa como `opacity-60` ou `text-graphite/60` em fundos claros é contraindicado.
  - **Linguagem Cotidiana**: Evitar termos bancários ou conceituais. Preferir palavras de uso popular (ex: "Acertos", "Início", "Minhas Casas", "Ajustes").

## Strategic Approach

### Solution Direction
1. **Renomeação dos Rótulos das Abas (Nível de Apresentação)**:
   - Para manter a robustez do código e evitar refatorações desnecessárias em viewmodels e testes, os IDs internos das abas (`casas`, `hoje`, `faturas`, `perfil`) serão **preservados**. Faremos a alteração exclusivamente nos rótulos de exibição:
     - `casas` -> Rótulo alterado de **"Casas"** para **"Minhas Casas"** (ou manter "Casas", mas com maior legibilidade). O termo "Minhas Casas" personaliza o acesso e deixa claro que o usuário possui grupos diferentes.
     - `hoje` -> Rótulo alterado de **"Hoje"** para **"Início"**. O termo "Hoje" é confuso porque a tela exibe o acumulado e os saldos do período inteiro. "Início" é o padrão da indústria e de fácil compreensão.
     - `faturas` -> Rótulo alterado de **"Faturas"** para **"Acertos"**. "Faturas" sugere apenas cartões de crédito. A tela, no entanto, exibe a divisão final do mês e permite encerrar o período. No Brasil, "Acertos" é a palavra clássica para dividir despesas residenciais.
     - `perfil` -> Rótulo alterado de **"Perfil"** para **"Ajustes"** (ou "Opções"). A tela gerencia acessos dos membros e configurações da casa. "Ajustes" é muito mais intuitivo do que "Perfil".
     - FAB central (+) -> Manter o `aria-label` e o `data-testid`, mas melhorar a clareza acessível para "Registrar Gasto" ou "Adicionar Gasto".

2. **Substituição dos Ícones das Abas**:
   - Para a aba `hoje` (agora **Início**), trocar o ícone `Calendar` por `Home` (ou `LayoutDashboard`), fornecendo a indicação visual universal de tela inicial.
   - Para a aba `faturas` (agora **Acertos**), trocar o ícone `CreditCard` por `Coins`, representando a divisão e o acerto financeiro do grupo de forma lúdica e menos institucional.

3. **Ajustes de Acessibilidade Tipográfica**:
   - No `BottomTabBar.vue`, alterar o tamanho da fonte do rótulo de `text-[9px]` para `text-[11px]`.
   - Remover a classe `uppercase` do span do rótulo, exibindo os termos capitalizados (ex: "Início" em vez de "INÍCIO").
   - Substituir `text-graphite/60` por `text-graphite/85` nos botões das abas inativas. Isso aumenta drasticamente o contraste mantendo a estética discreta necessária para itens secundários.

### Key Design Decisions
- **Camada de Apresentação Desconectada do ID**: Manter os IDs internos inalterados. Alterar apenas os valores do array de `tabs` (atributos `label` e `icon`).
- **Uso de Ícones Padrão da Lucide**: Garantir que os novos ícones (`Home` e `Coins`) sejam importados diretamente de `lucide-vue-next` e respeitem as mesmas estilizações de stroke do design original.

### Alternatives Considered
- **Substituir o ID 'hoje' por 'inicio' e 'faturas' por 'acertos' em todo o sistema**: Rejeitado. Isso exigiria alterar a tipagem em `BottomTabBar.vue`, `DashboardSaldos.vue`, `App.vue`, além de quebrar testes unitários existentes. A separação entre o ID lógico e a label visual é a prática ideal de design de sistemas.

## Risk & Gap Analysis

### Requirement Ambiguities
- **Espaço Lateral em Telas Pequenas**: Rótulos como "Minhas Casas" (12 caracteres) ocupam mais espaço horizontal do que "Casas" (5 caracteres). Em telas muito pequenas (ex: 320px de largura de celulares antigos), isso pode causar quebras de linha ou sobreposições.
  - *Mitigação*: Utilizaremos `text-[11px]` que garante um bom balanço entre legibilidade e densidade espacial. Caso o espaço ainda seja um problema em telas super compactas, faremos uso de espaçamento adaptativo na navegação ou manteremos o rótulo como "Casas", porém maior e com melhor legibilidade.

### Edge Cases
- **Legibilidade de Ícones**: Idosos dependem muito da forma do ícone quando a visão é fraca. O ícone de `Coins` deve ser renderizado com traços grossos (`stroke-[1.8px]` ou `stroke-[2.5px]` quando ativo), assim como os outros ícones.

### Technical Risks
- n/a.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Renomear rótulo da aba "Hoje" para "Início" e atualizar seu ícone para `Home` | Sim | Focado em `BottomTabBar.vue`. |
| 2   | Renomear rótulo da aba "Faturas" para "Acertos" e atualizar seu ícone para `Coins` | Sim | Focado em `BottomTabBar.vue`. |
| 3   | Ajustar o rótulo da aba "Perfil" para "Ajustes" para refletir melhor as configurações do grupo | Sim | Focado em `BottomTabBar.vue`. |
| 4   | Aumentar a fonte do rótulo das abas de `9px` para `11px`, remover caixa alta e aumentar o contraste de inativo para `text-graphite/85` | Sim | Focado em `BottomTabBar.vue`. |
| 5   | Preservar a compatibilidade lógica interna (IDs de rotas e testes existentes) | Sim | Mantido as chaves de IDs lógicos como `'casas'`, `'hoje'`, `'faturas'`, `'perfil'`. |
