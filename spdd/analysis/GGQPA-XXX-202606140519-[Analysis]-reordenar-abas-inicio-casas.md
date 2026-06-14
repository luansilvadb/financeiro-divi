# SPDD Analysis: Reordenar Abas de Navegação (Início e Minhas Casas)

## Original Business Requirement
Preciso que mude a rota. dos itens de navegação de minhas casas e início Para que início fique? Para esquerda, não é como primeiro e minhas casas fique como segundo.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **BottomTabBar**: Componente de barra de navegação inferior (`src/views/components/ui/BottomTabBar.vue`) que contém os botões para alternar as abas principais do aplicativo e o botão central de adição (FAB).
- **Tab ('casas' | 'hoje' | 'faturas' | 'perfil')**: Definição conceitual e tipagem que controla o estado de navegação e exibição das views/modais correspondentes no frontend.
- **App (`App.vue`)**: Componente raiz que consome o `BottomTabBar` e reage às mudanças de aba através do manipulador `handleTabChange`.

### New Concepts Required
- Nenhum. A mudança trata-se estritamente de uma reordenação visual dos elementos na barra de navegação.

### Key Business Rules
- **Ordem de Exibição dos Itens de Navegação**:
  - 1º Item: **Início** (id: `'hoje'`, ícone: `Home`) - Acessa o dashboard principal da casa/período.
  - 2º Item: **Minhas Casas** (id: `'casas'`, ícone: `Building2`) - Permite selecionar ou alternar entre casas (tenants).
  - 3º Item: Botão Central (FAB) - Lança novo gasto.
  - 4º Item: **Acertos** (id: `'faturas'`, ícone: `Coins`) - Painel de acerto de contas e fechamento.
  - 5º Item: **Ajustes** (id: `'perfil'`, ícone: `MembroAvatar`) - Menu de configurações do usuário e perfil.

---

## Strategic Approach

### Solution Direction
A alteração será feita diretamente no array estático `tabs` dentro de [BottomTabBar.vue](file:///d:/projetos/financeiro-divi/src/views/components/ui/BottomTabBar.vue).
A ordem original do array é:
1. `casas` ("Minhas Casas")
2. `hoje` ("Início")
3. `faturas` ("Acertos")
4. `perfil` ("Ajustes")

A nova ordem proposta será:
1. `hoje` ("Início")
2. `casas` ("Minhas Casas")
3. `faturas` ("Acertos")
4. `perfil` ("Ajustes")

Isso fará com que o loop `v-for="tab in tabs.slice(0, 2)"` renderize "Início" primeiro (à esquerda) e "Minhas Casas" segundo (à direita de Início, antes do FAB).

### Key Design Decisions
- **Preservação de IDs e Tipos**: Manter os identificadores (`hoje` e `casas`) inalterados para que a integração com o `App.vue` e o resto das telas (como o `DashboardSaldos.vue` que escuta `activeTab`) permaneça idêntica, evitando qualquer efeito colateral em cascata.

### Alternatives Considered
- **Reordenamento Dinâmico via Props**: Descartado por ser desnecessariamente complexo para uma alteração de layout estático definitiva requisitada pelo negócio.

---

## Risk & Gap Analysis

### Requirement Ambiguities
- O usuário utiliza o termo "rota". No entanto, o frontend do projeto não utiliza um roteador com URLs dinâmicas para essas visualizações principais; em vez disso, controla a renderização de componentes e modais baseado em estado interno (`activeTab` e `currentView`). A alteração na barra de navegação atende plenamente ao intuito de "rota" visual descrito.

### Edge Cases
- **Comportamento da Aba Ativa Inicial**: Atualmente, o aplicativo é inicializado com a aba ativa sendo `hoje` ("Início"). Com a reordenação, o primeiro item selecionado continuará sendo "Início", o que é consistente e agora mais intuitivo (já que estará na primeira posição à esquerda).

### Technical Risks
- Nenhum risco técnico significativo identificado, pois o array é tipado de forma estrita (`as const`) e as chaves continuam sendo válidas para o tipo `Tab`.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | O item de menu "Início" deve ser exibido como o primeiro item (extrema esquerda) da barra de navegação. | Yes | Será o primeiro elemento do array de tabs. |
| 2 | O item de menu "Minhas Casas" deve ser exibido como o segundo item (imediatamente à direita de "Início"). | Yes | Será o segundo elemento do array de tabs. |
