# Plano de Implementação - Refatoração e Limpeza de Código Morto

> **Para agentes de execução:** SUB-SKILL REQUERIDA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam a sintaxe de caixa de seleção (`- [ ]`) para acompanhamento.

**Goal:** Higienizar a codebase do projeto Divi, removendo o ecossistema inativo de Transação e CalculadoraSaldos, eliminando métodos órfãos nos composables ativos e reduzindo a complexidade ciclomática na desduplicação de faturas.

**Architecture:** Remoção cirúrgica de arquivos órfãos via git, expurgo de métodos e variáveis mortas em composables de estado financeiro, e refatoração do carregador de faturas para extrair a lógica de migração do LocalStorage para um helper isolado.

**Tech Stack:** Vue 3, TypeScript, Vitest, Git.

---

### Tarefa 1: Remoção de Arquivos Mortos (Ecossistema de Transações)

**Arquivos:**
- Remover:
  * `src/modules/ledger/core/domain/Transacao.ts`
  * `src/modules/ledger/core/domain/Transacao.test.ts`
  * `src/modules/ledger/core/domain/Divisao.ts`
  * `src/modules/ledger/core/ports/ITransacaoRepository.ts`
  * `src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts`
  * `src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`
  * `src/modules/ledger/composables/useTransacoes.ts`
  * `src/modules/ledger/core/services/CalculadoraSaldos.ts`
  * `src/modules/ledger/core/services/CalculadoraSaldos.test.ts`
  * `src/modules/ledger/core/services/CalculadoraSaldos.spec.ts`
  * `src/modules/ledger/index.ts`

- [ ] **Passo 1: Remover os arquivos fisicamente via controle de versão**
  Executar no terminal:
  ```powershell
  git rm src/modules/ledger/core/domain/Transacao.ts src/modules/ledger/core/domain/Transacao.test.ts src/modules/ledger/core/domain/Divisao.ts src/modules/ledger/core/ports/ITransacaoRepository.ts src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts src/modules/ledger/composables/useTransacoes.ts src/modules/ledger/core/services/CalculadoraSaldos.ts src/modules/ledger/core/services/CalculadoraSaldos.test.ts src/modules/ledger/core/services/CalculadoraSaldos.spec.ts src/modules/ledger/index.ts
  ```

- [ ] **Passo 2: Rodar testes para garantir que não há importações quebradas**
  Executar:
  ```powershell
  npx vitest run
  ```
  Esperado: Os testes restantes passam sem erros de compilação ou importação.

---

### Tarefa 2: Ajuste no Sincronizador de Storage (Multi-abas)

**Arquivos:**
- Modificar: `src/modules/ledger/composables/useStorageSync.ts`

- [ ] **Passo 1: Remover importação e lógica referente a Transações**
  Editar `src/modules/ledger/composables/useStorageSync.ts` para remover o import de `useTransacoes` e o bloco de atualização condicional de `divi_transactions`.
  
  Código antes:
  ```typescript
  import { onMounted, onUnmounted } from 'vue'
  import { useMembros } from './useMembros'
  import { useTransacoes } from './useTransacoes'
  
  // ...
  const handleStorage = (e: StorageEvent) => {
    const { carregar: reloadMembros } = useMembros()
    const { carregar: reloadTransacoes } = useTransacoes()
  
    if (e.key === 'divi_transactions') {
      reloadTransacoes()
    }
    if (e.key === 'divi_membros') {
      reloadMembros()
    }
  }
  ```
  
  Código depois:
  ```typescript
  import { onMounted, onUnmounted } from 'vue'
  import { useMembros } from './useMembros'
  
  // ...
  const handleStorage = (e: StorageEvent) => {
    const { carregar: reloadMembros } = useMembros()
  
    if (e.key === 'divi_membros') {
      reloadMembros()
    }
  }
  ```

- [ ] **Passo 2: Rodar testes para validar**
  Executar:
  ```powershell
  npx vitest run
  ```
  Esperado: PASS.

- [ ] **Passo 3: Commit parcial**
  Executar:
  ```powershell
  git commit -am "refactor: remove dead transaction files and adjust storage sync"
  ```

---

### Tarefa 3: Remoção de Métodos e Campos Mortos nos Composables

**Arquivos:**
- Modificar: `src/modules/ledger/composables/useCartoesEFaturas.ts`
- Modificar: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`
- Modificar: `src/modules/ledger/composables/useDashboardCalculations.ts`

- [ ] **Passo 1: Remover métodos órfãos de useCartoesEFaturas.ts**
  Excluir `atualizarGastoDivisoesManual` e `atualizarGastoCompradorManual` (linhas 242-279) e remover suas referências do retorno do composable.

- [ ] **Passo 2: Remover variável morta de useNovoLancamentoWizard.ts**
  Excluir `querDividirAgora` (linha 162) e remover seu retorno do composable.

- [ ] **Passo 3: Remover métodos órfãos de useDashboardCalculations.ts**
  Excluir `getCartaoNome`, `faturaTemAcertosAtivos`, `sugerirProximoPeriodo`, `getAdiantamento`, `totalFuturasVencer` (linhas 33-35, 61-63, 90-98, 41-43, 125-127) e suas referências no retorno do composable.

- [ ] **Passo 4: Validar testes**
  Executar:
  ```powershell
  npx vitest run
  ```
  Esperado: PASS.

- [ ] **Passo 5: Commit parcial**
  Executar:
  ```powershell
  git commit -am "refactor: remove dead methods and variables from composables"
  ```

---

### Tarefa 4: Extração de Lógica de Migração em `useCartoesEFaturas.ts`

**Arquivos:**
- Modificar: `src/modules/ledger/composables/useCartoesEFaturas.ts`

- [ ] **Passo 1: Extrair a desduplicação de faturas para uma helper externa**
  Mover o bloco de código de migração e desduplicação do método `carregar()` (linhas 48 a 141) para uma função pura `desduplicarEMigrarFaturas(todasFaturas: Fatura[]): Promise<Fatura[]>` declarada no rodapé do arquivo.
  
  Código do helper a ser inserido no final de `useCartoesEFaturas.ts`:
  ```typescript
  async function desduplicarEMigrarFaturas(todasFaturas: Fatura[]): Promise<Fatura[]> {
    let maisRecenteAno = 0
    let maisRecenteMes = 0
    for (const f of todasFaturas) {
      if (f.status === 'ABERTA') {
        if (f.periodo.ano > maisRecenteAno || (f.periodo.ano === maisRecenteAno && f.periodo.mes > maisRecenteMes)) {
          maisRecenteAno = f.periodo.ano
          maisRecenteMes = f.periodo.mes
        }
      }
    }

    if (maisRecenteAno === 0) {
      const hoje = new Date()
      maisRecenteMes = hoje.getMonth() + 1
      maisRecenteAno = hoje.getFullYear()
    }

    const faturasUnicas = new Map<string, Fatura>()
    const faturasParaRemover: Fatura[] = []
    
    for (const f of todasFaturas) {
      const chave = `${f.cartaoId}-${f.periodo.mes}-${f.periodo.ano}`
      const existente = faturasUnicas.get(chave)
      if (existente) {
        const isPassado = f.periodo.ano < maisRecenteAno || (f.periodo.ano === maisRecenteAno && f.periodo.mes < maisRecenteMes)
        let manter = existente
        let remover = f
        
        if (!isPassado) {
          if (f.status === 'ABERTA' && existente.status !== 'ABERTA') {
            manter = f
            remover = existente
          }
        } else {
          if (f.status !== 'ABERTA' && existente.status === 'ABERTA') {
            manter = f
            remover = existente
          }
        }
        
        faturasUnicas.set(chave, manter)
        faturasParaRemover.push(remover)
      } else {
        faturasUnicas.set(chave, f)
      }
    }

    if (faturasParaRemover.length > 0) {
      console.warn(`[Divi Migration] Detectadas ${faturasParaRemover.length} faturas duplicadas. Iniciando migração...`)
      const todosGastos = await gastoRepo.listarTodos()
      
      for (const fRem of faturasParaRemover) {
        const chave = `${fRem.cartaoId}-${fRem.periodo.mes}-${fRem.periodo.ano}`
        const fMant = faturasUnicas.get(chave)!
        
        const gastosMigrar = todosGastos.filter(g => g.faturaId === fRem.id)
        for (const g of gastosMigrar) {
          const novoGasto = new Gasto({
            id: g.id,
            faturaId: fMant.id,
            descricao: g.descricao,
            valorTotal: g.valorTotal,
            compradorId: g.compradorId,
            divisoes: g.divisoes,
            installments: g.installments,
            isLoan: g.isLoan,
            borrowerId: g.borrowerId,
            recurringBillId: g.recurringBillId,
            isSettlement: g.isSettlement,
            settlementDetails: g.settlementDetails,
            method: g.method,
            cardOwner: g.cardOwner
          })
          await gastoRepo.salvar(novoGasto)
        }
      }
      
      const listaLimpa = Array.from(faturasUnicas.values())
      localStorage.setItem('divi_faturas', JSON.stringify(listaLimpa.map(f => ({
        id: f.id,
        cartaoId: f.cartaoId,
        periodo: f.periodo,
        responsavelId: f.responsavelId,
        status: f.status,
        dataPagamentoBanco: f.dataPagamentoBanco ? f.dataPagamentoBanco.toISOString() : undefined
      }))))
      return listaLimpa
    }
    return todasFaturas
  }
  ```

- [ ] **Passo 2: Simplificar o carregamento chamando o helper**
  No escopo de `carregar()`, substituir o bloco de migração por:
  ```typescript
  let todasFaturas = await faturaRepo.listarTodas()
  todasFaturas = await desduplicarEMigrarFaturas(todasFaturas)
  ```

- [ ] **Passo 3: Rodar a suíte inteira de testes**
  Executar:
  ```powershell
  npx vitest run
  ```
  Esperado: Todos os 130 testes passam com sucesso.

- [ ] **Passo 4: Compilar o build de produção**
  Executar:
  ```powershell
  npm run build
  ```
  Esperado: Build concluído com sucesso sem erros.

- [ ] **Passo 5: Commit final**
  Executar:
  ```powershell
  git commit -am "refactor: extract invoice migration logic to reduce cyclomatic complexity in useCartoesEFaturas"
  ```
