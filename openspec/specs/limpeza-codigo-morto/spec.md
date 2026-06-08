# Capability: Limpeza de Código Morto

## Purpose
Remoção de componentes, scripts e estilos órfãos para reduzir o tamanho do bundle e o ruído no desenvolvimento.

## Requirements

### Requirement: Remoção de componentes órfãos
O sistema SHALL ser limpo de todos os artefatos que não possuem referências ativas no código-fonte, incluindo assets, documentação, benchmarks, e abstrações cerimoniais sem polimorfismo.

#### Scenario: Remoção do SectionLabel
- **WHEN** o componente `SectionLabel.vue` é identificado como sem referências ativas em telas (.vue) ou scripts (.ts)
- **THEN** o arquivo SHALL ser excluído fisicamente do repositório.

#### Scenario: Remoção de asset órfão hero.png
- **WHEN** o arquivo `src/assets/hero.png` é identificado como sem referências em nenhum arquivo `.vue`, `.ts`, `.css` ou `.html` do projeto
- **THEN** o arquivo SHALL ser excluído fisicamente do repositório

#### Scenario: Remoção de documentação sem propósito
- **WHEN** o diretório `docs/superpowers/` é identificado como contendo apenas subpastas vazias ou sem impacto no runtime
- **THEN** o diretório inteiro SHALL ser excluído fisicamente do repositório

#### Scenario: Remoção de benchmark fossilizado
- **WHEN** o arquivo `backend/benchmarks/benchmark_salvarMuitosGastos.ts` é identificado como sem runner, sem CI, e sem integração com qualquer pipeline
- **THEN** o arquivo e o diretório `backend/benchmarks/` SHALL ser excluídos se ficarem vazios

#### Scenario: Remoção de interfaces de service cerimoniais
- **WHEN** uma interface de service (`IGastoService`, `IFaturaService`, `IMembroService`) possui exatamente uma implementação e não é usada para mock em nenhum teste
- **THEN** a interface SHALL ser removida e seus consumidores SHALL referenciar a classe concreta diretamente

#### Scenario: Relocação de tipos exportados das interfaces removidas
- **WHEN** uma interface removida exporta tipos auxiliares (`LancarGastoInput`, `NettingInput`)
- **THEN** esses tipos SHALL ser relocados para o arquivo da classe que os consome diretamente

#### Scenario: Remoção de interface inline ILancamentoService
- **WHEN** a interface `ILancamentoService` em `LancamentoService.ts` é usada apenas como type hint do parâmetro default no construtor de `GastoService`
- **THEN** a interface SHALL ser removida e o parâmetro SHALL usar o tipo da classe `LancamentoService` diretamente

### Requirement: Auditoria de arquivos e imports
O sistema SHALL passar por uma revisão de imports para garantir que nenhum "fantasma" de código morto permaneça referenciado após a remoção.

#### Scenario: Verificação de imports em main.css e index.html
- **WHEN** a limpeza for executada
- **THEN** o desenvolvedor SHALL verificar se existem estilos ou scripts globais órfãos que possam ser removidos.

#### Scenario: Verificação de imports após remoção de interfaces
- **WHEN** as interfaces de service são removidas
- **THEN** o desenvolvedor SHALL verificar que nenhum arquivo importa os módulos deletados, usando `vue-tsc` para validar compilação

#### Scenario: Tipagem forte nos viewmodels
- **WHEN** refs no `useDashboardUIState.ts` usam `ref<any | null>` e o tipo real é conhecido
- **THEN** os refs SHALL ser tipados com o tipo correto (`Gasto`, `ContaFixa`, `TransferenciaNetting`, etc.)

#### Scenario: Tipagem de callbacks nos viewmodels
- **WHEN** callbacks no `useDashboardViewModel.ts` aceitam parâmetros tipados como `(d: any)`
- **THEN** os parâmetros SHALL ser tipados com interfaces nomeadas que descrevem o contrato esperado
