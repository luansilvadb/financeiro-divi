# Correções de Consistência e Concorrência Financeira - Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sanar as falhas críticas de integridade referencial, drift de timezone, duplicações de carryover no rollover e obsolescência de estado reativo mapeadas na auditoria.

**Architecture:** Transicionar operações assíncronas concorrentes para escopos atômicos, fixar o fuso horário contábil para o padrão de negócios (Brasília) e desduplicar carryovers via geração determinística de IDs.

**Tech Stack:** TypeScript, Vue 3, LocalStorage, Web Locks API, Vitest.

---

## Mapeamento de Arquivos

### [MODIFY] [Fatura.ts](file:///d:/projetos/divi/src/models/entities/Fatura.ts)
Estabilizar a determinação do período de faturamento fixando o timezone da data do gasto no fuso de negócios (Brasília/America/Sao_Paulo).

### [MODIFY] [IFaturaRepository.ts](file:///d:/projetos/divi/src/models/repositories/IFaturaRepository.ts) e [LocalStorageFaturaRepository.ts](file:///d:/projetos/divi/src/models/repositories/local/LocalStorageFaturaRepository.ts)
Implementar método de criação atômica sob Lock para eliminar a corrida de faturas multi-aba.

### [MODIFY] [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts)
Adequar a lógica de criação de faturas para usar o método atômico e introduzir a geração de IDs determinísticos para desduplicação de carryover e netting.

### [MODIFY] [NettingService.ts](file:///d:/projetos/divi/src/models/services/NettingService.ts)
Substituir floats por centavos absolutos em toda a lógica de balanceamento e netting.

### [MODIFY] [FaturaRolloverService.ts](file:///d:/projetos/divi/src/models/services/FaturaRolloverService.ts)
Integrar com a desduplicação de carryovers de netting e estabilizar a migração de parcelamentos legados.

### [MODIFY] [useCartoesEFaturas.ts](file:///d:/projetos/divi/src/viewmodels/useCartoesEFaturas.ts)
Introduzir fila de inicialização e debounce reativo para evitar drift de estado na UI.

---

### Task 1: Estabilizar Período de Faturamento no Timezone de Brasília (America/Sao_Paulo)

**Files:**
- Modify: [Fatura.ts](file:///d:/projetos/divi/src/models/entities/Fatura.ts)
- Test: [Fatura.test.ts](file:///d:/projetos/divi/src/models/entities/Fatura.test.ts)

- [ ] **Step 1: Escrever testes unitários falhando para instabilidade de Timezone**
  Validar que um gasto efetuado no mesmo instante em fusos diferentes cai na mesma fatura baseando-se no fuso de Brasília.
  ```typescript
  // Adicionar ao final de src/models/entities/Fatura.test.ts
  it('deve determinar o mesmo periodo de fatura independente do timezone local do dispositivo', () => {
    // 2026-05-20T02:30:00Z -> equivale a 19/05/2026 23:30 em Brasília (UTC-3)
    const dataGasto = new Date('2026-05-20T02:30:00.000Z')
    const periodo = determinarPeriodoFatura(dataGasto, 20)
    
    // Como em Brasília é dia 19, e 19 < 20, deve cair em Maio
    expect(periodo.mes).toBe(5)
    expect(periodo.ano).toBe(2026)
  })
  ```

- [ ] **Step 2: Executar testes para certificar que o teste de timezone falha**
  Executar: `npx vitest src/models/entities/Fatura.test.ts`
  *Espera-se falha se o fuso local do dispositivo de teste for UTC+0 ou maior (como em Londres, onde seria dia 20 e cairia em Junho).*

- [ ] **Step 3: Implementar determinação de período forçando timezone de Brasília**
  Modificar `determinarPeriodoFatura` no arquivo [Fatura.ts](file:///d:/projetos/divi/src/models/entities/Fatura.ts#L17-L34):
  ```typescript
  export function determinarPeriodoFatura(dataGasto: Date, diaFechamento: number): FaturaPeriodo {
    if (diaFechamento < 1 || diaFechamento > 31) {
      throw new Error('diaFechamento deve ser entre 1 e 31')
    }

    // Formatar partes da data no timezone America/Sao_Paulo
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
    const partes = formatter.formatToParts(dataGasto)
    const diaGasto = parseInt(partes.find(p => p.type === 'day')!.value)
    let mes = parseInt(partes.find(p => p.type === 'month')!.value)
    let ano = parseInt(partes.find(p => p.type === 'year')!.value)

    if (diaGasto >= diaFechamento) {
      mes += 1
      if (mes > 12) {
        mes = 1
        ano += 1
      }
    }
    return { mes, ano }
  }
  ```

- [ ] **Step 4: Executar testes de faturas e assegurar aprovação**
  Executar: `npx vitest src/models/entities/Fatura.test.ts`
  *Espera-se: PASS*

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/entities/Fatura.ts src/models/entities/Fatura.test.ts
  git commit -m "fix: force timezone de Brasilia para determinacao consistente de faturas"
  ```

---

### Task 2: Criação Atômica de Faturas no Repositório

**Files:**
- Modify: [IFaturaRepository.ts](file:///d:/projetos/divi/src/models/repositories/IFaturaRepository.ts)
- Modify: [LocalStorageFaturaRepository.ts](file:///d:/projetos/divi/src/models/repositories/local/LocalStorageFaturaRepository.ts)

- [ ] **Step 1: Declarar o método no contrato do repositório**
  Adicionar ao arquivo [IFaturaRepository.ts](file:///d:/projetos/divi/src/models/repositories/IFaturaRepository.ts):
  ```typescript
  assegurarObterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<Fatura>
  ```

- [ ] **Step 2: Implementar o método sob Lock atômico no LocalStorageFaturaRepository**
  Adicionar a [LocalStorageFaturaRepository.ts](file:///d:/projetos/divi/src/models/repositories/local/LocalStorageFaturaRepository.ts):
  ```typescript
  async assegurarObterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<Fatura> {
    return await StorageLock.executarAtomico('lock_divi_faturas', async () => {
      const todas = this.listarTodasInternal()
      let fatura = todas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
      if (!fatura) {
        fatura = new Fatura({
          id: crypto.randomUUID(),
          cartaoId,
          periodo: { mes, ano },
          responsavelId,
          status: 'ABERTA'
        })
        todas.push(fatura)
        this.salvarListaFaturasFisicamente(todas)
      }
      return fatura
    })
  }
  ```

- [ ] **Step 3: Criar teste de corrida multi-aba para criação de faturas**
  Adicionar a [LocalStorageFaturaRepository.test.ts](file:///d:/projetos/divi/src/models/repositories/local/LocalStorageFaturaRepository.test.ts):
  ```typescript
  it('deve assegurar obter ou criar faturas concorrentemente de forma atomica retornando mesmo ID', async () => {
    const repo = new LocalStorageFaturaRepository()
    
    // Executar chamadas concorrentes paralelas simulando abas
    const promises = Array.from({ length: 5 }).map(() => 
      repo.assegurarObterOuCriarFatura('cartao-race', 5, 2026, 'membro-a')
    )
    const resultados = await Promise.all(promises)
    
    const primeiroId = resultados[0].id
    resultados.forEach(f => {
      expect(f.id).toBe(primeiroId) // Todos devem apontar para a mesma fatura física
    })
  })
  ```

- [ ] **Step 4: Executar testes de repositório e certificar sucesso**
  Executar: `npx vitest src/models/repositories/local/LocalStorageFaturaRepository.test.ts`
  *Espera-se: PASS*

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/repositories/IFaturaRepository.ts src/models/repositories/local/LocalStorageFaturaRepository.ts src/models/repositories/local/LocalStorageFaturaRepository.test.ts
  git commit -m "feat: adicionar metodo atomico assegurarObterOuCriarFatura para eliminar corrida de faturas"
  ```

---

### Task 3: Integrar GastoService com a Criação Atômica de Faturas e IDs Determinísticos

**Files:**
- Modify: [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts)

- [ ] **Step 1: Substituir obterOuCriarFatura pelo método atômico do repositório**
  Remover o método privado e as promessas em memória (`faturasEmCriacao`).
  Modificar [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts#L75-L98):
  ```typescript
  // Remover a propriedade: private faturasEmCriacao = new Map<string, Promise<Fatura>>()
  // E no local de obterOuCriarFatura:
  const faturaAtiva = await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, periodo.mes, periodo.ano, responsavelFaturaId)
  ```

- [ ] **Step 2: Gerar ID Determinístico para transações de Carryover e Netting**
  Evitar duplicações sob rollover concorrente gerando hashes baseados nos dados imutáveis da transação do período.
  Substituir o ID aleatório em `registrarAcertoNetting` e no rollover por IDs determinísticos em [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts#L258-L273):
  ```typescript
  // No método registrarAcertoNetting:
  const deterministicId = `netting-${dados.faturaId}-${dados.fromMemberId}-${dados.toMemberId}-${dados.valor}`
  const acertoGasto = new Gasto({
    id: deterministicId,
    faturaId: dados.faturaId,
    // ... restante mantido
  })
  ```

- [ ] **Step 3: Ajustar lancarGastoContaFixa para usar ID determinístico**
  Adicionar a [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts#L330-L343):
  ```typescript
  // No método lancarGastoContaFixa:
  const deterministicId = `bill-${dados.faturaId}-${dados.conta.id}`
  const novoGasto = new Gasto({
    id: deterministicId,
    faturaId: dados.faturaId,
    // ... restante mantido
  })
  ```

- [ ] **Step 4: Executar testes de integração do GastoService**
  Executar: `npx vitest src/models/services/GastoService.test.ts`
  *Espera-se: PASS*

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/services/GastoService.ts
  git commit -m "feat: integrar GastoService com faturas atomicas e IDs deterministicos para carryovers"
  ```

---

### Task 4: Netting Baseado Inteiramente em Centavos Absolutos (Value Object Dinheiro)

**Files:**
- Modify: [NettingService.ts](file:///d:/projetos/divi/src/models/services/NettingService.ts)

- [ ] **Step 1: Alterar calcularSaldosUnificados para reter a precisão centesimal**
  Retornar os saldos diretamente em inteiros centesimais ao invés de floats.
  Modificar [NettingService.ts](file:///d:/projetos/divi/src/models/services/NettingService.ts#L13-L72):
  ```typescript
  export function calcularSaldosUnificados(
    membros: { id: string }[],
    gastos: Gasto[]
  ): Record<string, number> {
    const saldosCentavos: Record<string, number> = {}
    membros.forEach(m => { saldosCentavos[m.id] = 0 })

    gastos.forEach(g => {
      const divisor = g.totalInstallments || g.installments || 1
      const parcelaAtualIdx = Math.max(0, divisor - g.installments)

      if (g.isLoan) {
        const parcelasEmprestimo = g.valorTotal.distribuir(divisor)
        if (parcelaAtualIdx < parcelasEmprestimo.length) {
          const valorParcelaCentavos = parcelasEmprestimo[parcelaAtualIdx].centavos
          if (g.compradorId) {
            saldosCentavos[g.compradorId] = (saldosCentavos[g.compradorId] || 0) + valorParcelaCentavos
          }
          if (g.borrowerId) {
            saldosCentavos[g.borrowerId] = (saldosCentavos[g.borrowerId] || 0) - valorParcelaCentavos
          }
        }
      } else {
        const pagadorId = (g.method === 'card' && g.cardOwner) ? g.cardOwner : g.compradorId
        let totalDebitosCentavos = 0
        g.divisoes.forEach(div => {
          const distribuicaoDiv = div.valor.distribuir(divisor)
          if (parcelaAtualIdx < distribuicaoDiv.length) {
            const valorDebitoCentavos = distribuicaoDiv[parcelaAtualIdx].centavos
            saldosCentavos[div.membroId] = (saldosCentavos[div.membroId] || 0) - valorDebitoCentavos
            totalDebitosCentavos += valorDebitoCentavos
          }
        })

        if (pagadorId) {
          saldosCentavos[pagadorId] = (saldosCentavos[pagadorId] || 0) + totalDebitosCentavos
        }
      }
    })

    // Retorna saldo bruto em centavos (como inteiro)
    return saldosCentavos
  }
  ```

- [ ] **Step 2: Ajustar calcularTransacoesNetting para operar em centavos**
  Substituir o algoritmo guloso float por inteiros centesimais absolutos.
  Modificar [NettingService.ts](file:///d:/projetos/divi/src/models/services/NettingService.ts#L78-L119):
  ```typescript
  export function calcularTransacoesNetting(saldosCentavos: Record<string, number>): TransferenciaNetting[] {
    const creditors: { id: string; val: number }[] = []
    const debtors: { id: string; val: number }[] = []

    for (const mId in saldosCentavos) {
      const val = saldosCentavos[mId]
      if (val > 0) {
        creditors.push({ id: mId, val })
      } else if (val < 0) {
        debtors.push({ id: mId, val: -val })
      }
    }

    creditors.sort((a, b) => b.val - a.val)
    debtors.sort((a, b) => b.val - a.val)

    const transferencias: TransferenciaNetting[] = []
    let cIdx = 0
    let dIdx = 0

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx]
      const debtor = debtors[dIdx]
      const amount = Math.min(creditor.val, debtor.val)

      if (amount > 0) {
        transferencias.push({
          from: debtor.id,
          to: creditor.id,
          val: amount / 100 // Expor valor convertido apenas na saída da transferência
        })
      }

      creditor.val -= amount
      debtor.val -= amount

      if (creditor.val === 0) cIdx++
      if (debtor.val === 0) dIdx++
    }

    return transferencias;
  }
  ```

- [ ] **Step 3: Ajustar ViewModels e Rollover adaptando para receber centavos inteiros**
  Corrigir os tipos nos arquivos que importam os saldos de netting e saldo unificado (ex: ViewModel converte centavos em reais apenas para exibição da tela).
  Modificar as dependências em [useDashboardViewModel.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardViewModel.ts#L317-L320):
  ```typescript
  const membrosVisiveis = computed(() => {
    return props.membros.filter(m => {
      if (m.ativo !== false) return true
      const saldoCentavos = saldosUnificadosAtivos.value[m.id] || 0
      return Math.abs(saldoCentavos) > 0
    })
  })
  ```

- [ ] **Step 4: Executar testes de Netting e ViewModel**
  Executar: `npx vitest src/models/services/NettingService.test.ts`
  Executar: `npx vitest src/viewmodels/useDashboardViewModel.test.ts`
  *Espera-se: PASS*

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/services/NettingService.ts src/viewmodels/useDashboardViewModel.ts
  git commit -m "fix: netting baseado inteiramente em centavos absolutos eliminando float drift"
  ```

---

### Task 5: Estabilizar o Rollover de Período e IDs Determinísticos no Netting Inicial

**Files:**
- Modify: [FaturaRolloverService.ts](file:///d:/projetos/divi/src/models/services/FaturaRolloverService.ts)

- [ ] **Step 1: Aplicar IDs Determinísticos e saldos em centavos no Rollover**
  Modificar [FaturaRolloverService.ts](file:///d:/projetos/divi/src/models/services/FaturaRolloverService.ts#L42-L62):
  ```typescript
  gerarTransacoesNettingSaldoInicial(
    novaFaturaId: string,
    nomePeriodoAnterior: string,
    saldosAnterioresCentavos: Record<string, number>
  ): Gasto[] {
    const transferencias = calcularTransacoesNetting(saldosAnterioresCentavos)

    return transferencias.map(t => {
      const total = Dinheiro.deReais(t.val)
      const deterministicId = `carryover-${novaFaturaId}-${t.from}-${t.to}-${total.centavos}`
      return new Gasto({
        id: deterministicId,
        faturaId: novaFaturaId,
        descricao: `Saldo Inicial Pendente (${nomePeriodoAnterior})`,
        valorTotal: total,
        compradorId: t.to,
        divisoes: [new DivisaoDeGasto(t.from, total)],
        installments: 1,
        isSettlement: true
      })
    })
  }
  ```

- [ ] **Step 2: Estabilizar migração de divisor de parcelas legadas**
  Assegurar que `totalInstallments` preserve o divisor histórico.
  Modificar [FaturaRolloverService.ts](file:///d:/projetos/divi/src/models/services/FaturaRolloverService.ts#L20-L40):
  ```typescript
  processarRolloverParcelas(novaFaturaId: string, gastosAnteriores: Gasto[]): Gasto[] {
    return gastosAnteriores
      .filter(g => g.installments > 1 && !g.grupoParcelasId)
      .map(g => {
        const divisor = g.totalInstallments || g.installments
        const deterministicId = `rollover-legacy-${novaFaturaId}-${g.id}`
        return new Gasto({
          id: deterministicId,
          faturaId: novaFaturaId,
          descricao: g.descricao,
          valorTotal: g.valorTotal,
          compradorId: g.compradorId,
          divisoes: [...g.divisoes],
          installments: g.installments - 1,
          totalInstallments: divisor, // Preserva o divisor histórico
          isLoan: g.isLoan,
          borrowerId: g.borrowerId,
          recurringBillId: g.recurringBillId
        })
      })
  }
  ```

- [ ] **Step 3: Adicionar testes de idempotência e migração no rollover**
  Adicionar a [FaturaRolloverService.test.ts](file:///d:/projetos/divi/src/models/services/FaturaRolloverService.test.ts):
  ```typescript
  it('deve gerar IDs deterministicos para carryovers impedindo duplicacoes', () => {
    const service = new FaturaRolloverService(faturaRepo, gastoRepo, faturaService)
    const saldos = { 'membro-a': -1000, 'membro-b': 1000 } // R$ 10,00
    
    const gastos1 = service.gerarTransacoesNettingSaldoInicial('fat-new', 'Maio', saldos)
    const gastos2 = service.gerarTransacoesNettingSaldoInicial('fat-new', 'Maio', saldos)
    
    expect(gastos1[0].id).toBe(gastos2[0].id)
  })
  ```

- [ ] **Step 4: Executar testes de rollover**
  Executar: `npx vitest src/models/services/FaturaRolloverService.test.ts`
  *Espera-se: PASS*

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/services/FaturaRolloverService.ts src/models/services/FaturaRolloverService.test.ts
  git commit -m "fix: desduplicacao deterministica e correcao de divisor legado no rollover"
  ```

---

### Task 6: Fila de Inicialização e Prevenção de Drift Reativo no Vue Singleton

**Files:**
- Modify: [useCartoesEFaturas.ts](file:///d:/projetos/divi/src/viewmodels/useCartoesEFaturas.ts)

- [ ] **Step 1: Implementar controle de recarga enfileirada no singleton**
  Garantir que atualizações concorrentes reiniciem a sincronização de dados se chamadas durante uma leitura ativa.
  Modificar [useCartoesEFaturas.ts](file:///d:/projetos/divi/src/viewmodels/useCartoesEFaturas.ts#L67-L108):
  ```typescript
  let inicializacaoPendente = false

  const inicializar = async () => {
    if (promiseInicializacao) {
      inicializacaoPendente = true
      return promiseInicializacao
    }
    
    state.value.estaCarregando = true
    state.value.erroInicializacao = null

    const carregar = async () => {
      try {
        if (typeof localFaturaRepo.executarMigracoesEDesduplicacao === 'function') {
          await localFaturaRepo.executarMigracoesEDesduplicacao()
        }

        const todosCartoes = await localCartaoRepo.listarTodos()
        state.value.cartoes = todosCartoes

        const hoje = new Date()
        const mesAtual = hoje.getMonth() + 1
        const anoAtual = hoje.getFullYear()

        const todasFaturas = await localFaturaService.assegurarFaturasAbertas(todosCartoes, mesAtual, anoAtual)
        state.value.faturas = todasFaturas

        const todosAcertos = await localAcertoRepo.listarTodos()
        const todosGastos = await localGastoRepo.listarTodos()
        state.value.acertos = todosAcertos
        state.value.gastos = todosGastos
        state.value.inicializado = true
      } catch (err: any) {
        state.value.erroInicializacao = err?.message || 'Falha de leitura'
        throw err
      } finally {
        state.value.estaCarregando = false
      }
    }

    promiseInicializacao = carregar()
    try {
      await promiseInicializacao
    } finally {
      promiseInicializacao = null
      if (inicializacaoPendente) {
        inicializacaoPendente = false
        // Se houve chamada concorrente, executa novo ciclo para sincronizar com as ultimas escritas
        await inicializar()
      }
    }
  }
  ```

- [ ] **Step 2: Executar toda a suíte de testes do projeto e certificar integridade**
  Executar: `npm run test` ou `npx vitest run`
  *Espera-se: todos os testes passando com sucesso*

- [ ] **Step 3: Commit**
  ```bash
  git add src/viewmodels/useCartoesEFaturas.ts
  git commit -m "fix: fila de inicializacao reativa para evitar stale state na UI"
  ```
