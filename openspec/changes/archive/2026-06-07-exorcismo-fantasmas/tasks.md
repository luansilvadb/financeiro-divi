## 1. Deletar Fantasmas (Arquivos Mortos)

- [x] 1.1 Deletar `src/assets/hero.png` (asset sem referência)
- [x] 1.2 Deletar diretório `docs/superpowers/` por completo (debug/, plans/, specs/)
- [x] 1.3 Deletar `backend/benchmarks/benchmark_salvarMuitosGastos.ts` e o diretório `backend/benchmarks/` se ficar vazio

## 2. Extrair Função `resolverCartao`

- [x] 2.1 Criar `src/models/services/CartaoResolver.ts` com a função pura `resolverCartao` e a interface `CartaoResolvido`, conforme assinatura definida no design
- [x] 2.2 Escrever testes unitários em `src/models/services/CartaoResolver.test.ts` cobrindo todos os cenários do spec (pix, match por id, match por responsavelPadraoId, sem match, sem cardOwnerId)

## 3. Refatorar Services para Usar `resolverCartao`

- [x] 3.1 Refatorar `LancamentoService.lancarGastoOuEmprestimo` — substituir resolução inline de cartão (linhas 25-30) por chamada a `resolverCartao`
- [x] 3.2 Refatorar `GastoService.atualizarGastoCompleto` — substituir as 3 ocorrências de resolução inline de cartão (linhas 78-80, 114, 140) por chamadas a `resolverCartao`
- [x] 3.3 Rodar testes existentes de `LancamentoService.test.ts` e `GastoService.perf.test.ts` para validar que o comportamento permanece idêntico

## 4. Remover Interfaces Cerimoniais de Service

- [x] 4.1 Mover tipos `LancarGastoInput` e `NettingInput` de `IGastoService.ts` para `GastoService.ts` (ou arquivo dedicado de tipos se necessário)
- [x] 4.2 Deletar `src/models/services/IGastoService.ts`
- [x] 4.3 Deletar `src/models/services/IFaturaService.ts`
- [x] 4.4 Deletar `src/models/services/IMembroService.ts`
- [x] 4.5 Remover a interface `ILancamentoService` de `LancamentoService.ts` e atualizar o type hint no construtor de `GastoService`
- [x] 4.6 Atualizar todos os imports que referenciam as interfaces removidas (grep por `IGastoService`, `IFaturaService`, `IMembroService`, `ILancamentoService`)

## 5. Tipar Refs `any` nos ViewModels

- [x] 5.1 Em `useDashboardUIState.ts`: substituir `ref<any | null>` por tipos corretos — `gastoParaAjustar: ref<Gasto | null>`, `billSelecionada: ref<ContaFixa | null>`, `nettingTarget: ref<TransferenciaNetting | null>`, `itemParaEstornar: ref<Gasto | null>`
- [x] 5.2 Em `useDashboardViewModel.ts`: tipar os callbacks `confirmarAjusteGasto`, `confirmarBaixaNetting`, `confirmarLancarBill`, `confirmarSalvarTemplate` com interfaces nomeadas em vez de `(d: any)`

## 6. Validação Final

- [x] 6.1 Compilar o frontend com `vue-tsc -b` — zero erros de tipo
- [x] 6.2 Rodar suite completa de testes frontend com `npx vitest run`
- [x] 6.3 Verificar que o app inicia e funciona normalmente com `npm run dev`
