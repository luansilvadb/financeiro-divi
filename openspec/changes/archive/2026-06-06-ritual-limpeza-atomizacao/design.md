## Context

O repositório `financeiro-divi` cresceu organicamente, resultando em componentes Vue de alta densidade (monolitos) e nomes de variáveis em ViewModels que priorizaram a brevidade em detrimento da clareza. Além disso, existem componentes de UI antigos que foram substituídos, mas cujos arquivos permanecem no disco (fantasmas).

## Goals / Non-Goals

**Goals:**
- Eliminar arquivos sem referências (limpeza).
- Fragmentar `ConfiguracoesMembros.vue` em componentes menores.
- Restaurar a legibilidade do `useDashboardViewModel.ts`.
- Reduzir o acoplamento visual no dashboard através da simplificação do `SkeletonMimic.vue`.

**Non-Goals:**
- Alterar qualquer regra de negócio ou lógica financeira.
- Modificar o schema do banco de dados ou endpoints do backend.
- Refatorar outros ViewModels ou telas além dos especificados.

## Decisions

### 1. Extração de Componentes de Configuração
Decidimos mover a lógica de formulários que residem dentro de `ConfiguracoesMembros.vue` para subcomponentes dedicados.
- **Racional**: O arquivo atual possui > 1000 linhas, dificultando a manutenção de estilos e estados.
- **Estrutura**:
    - `MembroFormBottomSheet.vue`: Lógica de criação/edição de membros.
    - `CargoFormBottomSheet.vue`: Lógica de criação/edição de cargos e permissões.
    - `MembroListItem.vue`: Item da lista de moradores para reduzir o loop no template principal.

### 2. Renomeação Semântica no Dashboard ViewModel
Substituir sistematicamente as abreviações por nomes completos.
- `ui` → `dashboardUI`
- `ts` → `toast`
- `cx` → `cartoesEFaturas`
- `cf` → `contasFixas`
- `pd` → `periodos`
- `p` → `periodoSelecionado`
- `g` → `gastos`
- `sel` → `gastosFiltrados`

### 3. Eliminação do Componente Órfão
`SectionLabel.vue` será removido.
- **Racional**: Uma busca no repositório confirmou zero referências em arquivos `.vue` ou `.ts`.

## Risks / Trade-offs

- **[Risco]** Quebra de referências dinâmicas ou indiretas ao remover arquivos. → **Mitigação**: Executar um build completo (`npm run build`) e testes unitários após a remoção.
- **[Risco]** Perda de reatividade ao extrair lógica do ViewModel. → **Mitigação**: Manter as referências computadas e refs dentro da mesma estrutura de composição.
- **[Risco]** Inconsistência visual no Skeleton após simplificação. → **Mitigação**: Validar visualmente o estado de carregamento em diferentes latências de rede.
