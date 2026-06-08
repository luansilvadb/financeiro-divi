## Why

Reduzir a carga cognitiva e o custo de manutenção eliminando código morto, atomizando componentes excessivamente complexos e restaurando a clareza semântica do núcleo do sistema. O repositório apresenta "fantasmas" (código órfão) e "labirintos lógicos" (monolitos de UI e variáveis pouco descritivas) que obscurecem o funcionamento real da aplicação.

## What Changes

- **Remoção de Código Órfão**: Exclusão do componente `SectionLabel.vue` que não possui referências ativas.
- **Atomização do Monolito de Configurações**: Refatoração do `ConfiguracoesMembros.vue` para extrair lógicas de formulários e listas em componentes menores e focados.
- **Clareza Semântica no ViewModel**: Refatoração do `useDashboardViewModel.ts` para substituir nomes de variáveis abreviados (ex: `cx`, `pd`, `sel`) por termos descritivos que revelem seu propósito.
- **Simplificação de Skeletons**: Revisão do `SkeletonMimic.vue` para avaliar a possibilidade de uma abordagem mais DRY ou simplificada que não exija manutenção manual duplicada da estrutura do dashboard.

## Capabilities

### New Capabilities
- `limpeza-codigo-morto`: Procedimento de auditoria e remoção de componentes e funções não utilizadas.
- `atomizacao-configuracoes-membros`: Estruturação modular da tela de gerenciamento de membros e cargos.
- `semantica-viewmodel-dashboard`: Padronização de nomes e clareza lógica no coração do dashboard.

### Modified Capabilities
- Nenhuma capacidade funcional existente terá seus requisitos de negócio alterados; as mudanças são estritamente estruturais e semânticas.

## Impact

- **Frontend**: Afeta diretamente `src/views/screens/ConfiguracoesMembros.vue`, `src/viewmodels/useDashboardViewModel.ts` e a estrutura de componentes em `src/views/components/ui/`.
- **Arquitetura**: Melhora a manutenibilidade e a velocidade de onboarding para novos fluxos de desenvolvimento.
- **Performance**: Redução marginal no bundle size pela remoção de código morto.
