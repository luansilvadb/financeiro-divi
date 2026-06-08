## ADDED Requirements

### Requirement: Extração de subcomponentes de formulário
O componente `ConfiguracoesMembros.vue` SHALL ser decomposto em subcomponentes menores para facilitar a leitura e manutenção, movendo lógicas específicas de formulários para seus próprios arquivos.

#### Scenario: Extração do formulário de membros
- **WHEN** o código do formulário de novo membro/edição for identificado como um bloco lógico independente
- **THEN** ele SHALL ser extraído para um componente como `FormularioMembro.vue` ou similar dentro de `src/views/components/ledger/`.

#### Scenario: Extração da gestão de cargos
- **WHEN** a lógica de listagem e edição de cargos for identificada como complexidade adicional no monolito
- **THEN** ela SHALL ser movida para um componente dedicado, como `GestaoCargos.vue`.

### Requirement: Redução da contagem de linhas
O arquivo original `ConfiguracoesMembros.vue` SHALL ter sua contagem de linhas reduzida significativamente (objetivo: < 400 linhas) após a atomização.

#### Scenario: Verificação de densidade
- **WHEN** a refatoração for concluída
- **THEN** o arquivo principal SHALL conter apenas a orquestração dos subcomponentes e o layout de alto nível.
