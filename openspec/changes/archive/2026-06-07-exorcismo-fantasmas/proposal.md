## Why

A autópsia do repositório revelou fantasmas precisos que acumulam ruído sem produzir valor: um asset órfão (`hero.png`), interfaces de service cerimoniais sem polimorfismo, lógica de resolução de cartão duplicada 3 vezes dentro de `GastoService`, e refs tipadas como `any` nos viewmodels que apagam a intenção do código. Nenhum desses problemas é grave isoladamente, mas juntos formam uma camada de fumaça que dificulta navegação, manutenção e confiança na base de código. O momento é agora porque o sistema está estável e funcional — o corte é cirúrgico, sem risco de regressão comportamental.

## What Changes

- **Deletar `src/assets/hero.png`** — asset sem referência em nenhum arquivo do projeto
- **Deletar `docs/superpowers/`** — diretório vazio de propósito (subpastas sem conteúdo ativo)
- **Deletar `backend/benchmarks/benchmark_salvarMuitosGastos.ts`** — benchmark fossilizado sem runner ou integração
- **Remover interfaces cerimoniais de Service** (`IGastoService.ts`, `IFaturaService.ts`, `IMembroService.ts`) e fazer os consumidores referenciarem as classes diretamente. As interfaces de *Repository* permanecem intactas (são mockadas nos testes).
- **Remover `ILancamentoService`** exportada inline em `LancamentoService.ts` — usada apenas como type hint default
- **Extrair `resolverCartao()`** como função pura em `src/models/services/CartaoResolver.ts`, eliminando a triplicação de lógica de resolução de cartão em `GastoService` (linhas 79, 114, 140) e `LancamentoService` (linha 26)
- **Tipar refs `any` nos viewmodels**: substituir os 4 `ref<any | null>` em `useDashboardUIState.ts` pelos tipos reais (`Gasto`, `ContaFixa`, `TransferenciaNetting`) e tipar os callbacks `(d: any)` em `useDashboardViewModel.ts`

## Capabilities

### New Capabilities
- `resolucao-cartao`: Extração da lógica duplicada de resolução de cartão (match por id ou responsavelPadraoId, fallback para PIX_DEFAULT_ID) em uma função pura reutilizável.

### Modified Capabilities
- `limpeza-codigo-morto`: Expansão do escopo da limpeza para incluir assets órfãos, interfaces cerimoniais, e documentação sem propósito — além dos componentes já cobertos pelo spec existente.

## Impact

### Frontend (`src/`)
- **Deletados**: `assets/hero.png`
- **Deletados**: `models/services/IGastoService.ts`, `models/services/IFaturaService.ts`, `models/services/IMembroService.ts`
- **Novo arquivo**: `models/services/CartaoResolver.ts`
- **Modificados**: `models/services/GastoService.ts`, `models/services/LancamentoService.ts` (usar `resolverCartao`), `viewmodels/useDashboardUIState.ts`, `viewmodels/useDashboardViewModel.ts` (tipagem)
- **Testes**: atualizar imports que referenciam interfaces removidas

### Backend (`backend/`)
- **Deletados**: `benchmarks/benchmark_salvarMuitosGastos.ts`

### Docs
- **Deletados**: `docs/superpowers/` (diretório inteiro)

### Sem impacto em:
- Esquema Prisma (nenhuma alteração de dados)
- WebSocket Gateway (nenhuma alteração de eventos)
- Comportamento do usuário final (refactoring puro, zero mudança funcional)
- Interfaces de Repository (mantidas para mock nos testes)
