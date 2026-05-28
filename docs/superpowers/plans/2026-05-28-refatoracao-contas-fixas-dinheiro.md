# Refatoração de Contas Fixas para Centavos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar o uso de ponto flutuante (floats) no domínio, viewmodels e persistência para contas fixas, garantindo que o dinheiro seja trafegado estritamente em centavos puros (inteiros) e respeitando o GEMINI.md.

**Architecture:** Mudar a propriedade `fixedValue` para `fixedValueCentavos` em `ContaFixa`. Adaptar repositórios (adicionando compatibilidade retroativa na leitura de localStorage), atualizar assinaturas de serviços (lancarGastoContaFixa recebendo centavos) e atualizar as Views para efetuarem conversão nas bordas de entrada.

**Tech Stack:** Vue 3, TypeScript, Supabase, Vitest.

---

### Task 1: Modificação da Entidade de Domínio e Templates Padrão

**Files:**
- Modify: [ContaFixa.ts](../../../src/models/entities/ContaFixa.ts)
- Modify: [useContasFixas.ts](../../../src/viewmodels/useContasFixas.ts:8-14)

- [ ] **Step 1: Modificar a tipagem da entidade ContaFixa**

Alterar em [ContaFixa.ts](../../../src/models/entities/ContaFixa.ts):
```typescript
export interface ContaFixa {
  id: string
  name: string
  icon: string
  fixedValueCentavos: number | null
  defaultSplit: string[]
}
```

- [ ] **Step 2: Atualizar os templates padrão para centavos**

Alterar em [useContasFixas.ts](../../../src/viewmodels/useContasFixas.ts):
```typescript
const CONTAS_PADRAO: ContaFixa[] = [
  { id: 'aluguel', name: 'Aluguel da Casa', icon: '🔑', fixedValueCentavos: 150000, defaultSplit: [] },
  { id: 'luz', name: 'Energia (Luz)', icon: '💡', fixedValueCentavos: null, defaultSplit: [] },
  { id: 'agua', name: 'Água', icon: '💧', fixedValueCentavos: null, defaultSplit: [] },
  { id: 'internet', name: 'Internet', icon: '🌐', fixedValueCentavos: 12000, defaultSplit: [] },
  { id: 'cachorro', name: 'Cuidados Cachorro', icon: '🐶', fixedValueCentavos: null, defaultSplit: [] }
]
```

- [ ] **Step 3: Compilar para validar erros de tipo iniciais**
Run: `npx tsc --noEmit`
Expected: Erros de tipo indicando uso de `fixedValue` inexistente nos repositórios e testes.

---

### Task 2: Repositórios, Migrações e Persistência

**Files:**
- Modify: [SupabaseContaFixaRepository.ts](../../../src/models/repositories/supabase/SupabaseContaFixaRepository.ts:20,43)
- Modify: [LocalStorageContaFixaRepository.ts](../../../src/models/repositories/local/LocalStorageContaFixaRepository.ts:23-32)
- Modify: [MigrationService.ts](../../../src/models/services/MigrationService.ts:112)

- [ ] **Step 1: Modificar SupabaseContaFixaRepository**

Alterar a gravação no método `salvar()` em [SupabaseContaFixaRepository.ts](../../../src/models/repositories/supabase/SupabaseContaFixaRepository.ts):
```typescript
      fixed_value_centavos: conta.fixedValueCentavos,
```
E a leitura no método `listarTodas()`:
```typescript
      fixedValueCentavos: c.fixed_value_centavos !== null ? Number(c.fixed_value_centavos) : null,
```

- [ ] **Step 2: Adicionar tolerância a falhas na leitura do LocalStorage**

Alterar o método `listarTodas()` em [LocalStorageContaFixaRepository.ts](../../../src/models/repositories/local/LocalStorageContaFixaRepository.ts):
```typescript
  async listarTodas(): Promise<ContaFixa[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const parsed = JSON.parse(data) as any[]
      return parsed.map(c => {
        // Se já possui fixedValueCentavos, usa. Caso contrário, faz fallback do fixedValue legado
        const centavos = c.fixedValueCentavos !== undefined
          ? c.fixedValueCentavos
          : (c.fixedValue !== undefined && c.fixedValue !== null ? Math.round(c.fixedValue * 100) : null)
        
        return {
          id: c.id,
          name: c.name,
          icon: c.icon,
          fixedValueCentavos: centavos,
          defaultSplit: Array.isArray(c.defaultSplit) ? c.defaultSplit : []
        }
      })
    } catch (e) {
      console.error('Erro grave de integridade no banco de dados local de contas fixas:', e)
      throw new Error('Banco de dados local de contas fixas corrompido. Operação abortada para evitar perda de dados.')
    }
  }
```

- [ ] **Step 3: Atualizar a Migration**

Alterar o loop de migração de contas fixas em [MigrationService.ts](../../../src/models/services/MigrationService.ts):
```typescript
        fixed_value_centavos: cf.fixedValueCentavos,
```

- [ ] **Step 4: Atualizar os testes unitários do Repositório de LocalStorage**

Atualizar [LocalStorageContaFixaRepository.test.ts](../../../src/models/repositories/local/LocalStorageContaFixaRepository.test.ts) para usar a nova assinatura:
```typescript
    await repository.salvar({
      id: 'luz',
      name: 'Energia',
      icon: '💡',
      fixedValueCentavos: 1000000,
      defaultSplit: ['luciana']
    })
```
E testar a compatibilidade retroativa inserindo um registro bruto antigo:
```typescript
  it('deve migrar dados antigos do local storage contendo fixedValue', async () => {
    const repository = new LocalStorageContaFixaRepository()
    localStorage.setItem('divi_contas_fixas_templates_v18', JSON.stringify([{
      id: 'luz_antiga',
      name: 'Energia',
      icon: '💡',
      fixedValue: 120.50,
      defaultSplit: ['luan']
    }]))

    const list = await repository.listarTodas()
    expect(list[0].fixedValueCentavos).toBe(12050)
  })
```

- [ ] **Step 5: Rodar testes de repositório**
Run: `npx vitest run LocalStorageContaFixaRepository.test.ts`
Expected: PASS

---

### Task 3: Assinatura de Serviços e Lançamento de Gasto

**Files:**
- Modify: [IGastoService.ts](../../../src/models/services/IGastoService.ts:30-38)
- Modify: [GastoService.ts](../../../src/models/services/GastoService.ts:112-120)
- Modify: [LancamentoService.ts](../../../src/models/services/LancamentoService.ts:227-235)

- [ ] **Step 1: Atualizar a interface IGastoService**

Mudar a assinatura do método `lancarGastoContaFixa` em [IGastoService.ts](../../../src/models/services/IGastoService.ts):
```typescript
  lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void>
```

- [ ] **Step 2: Atualizar GastoService**

Mudar em [GastoService.ts](../../../src/models/services/GastoService.ts):
```typescript
  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    return this.lancamentoService.lancarGastoContaFixa(dados)
  }
```

- [ ] **Step 3: Atualizar LancamentoService**

Mudar a assinatura e a criação do Dinheiro em [LancamentoService.ts](../../../src/models/services/LancamentoService.ts):
```typescript
  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    const total = Dinheiro.deCentavos(dados.valorCentavos)
    const partes = total.distribuir(dados.participantes.length)
```

- [ ] **Step 4: Rodar testes de GastoService e LancamentoService**
Run: `npx vitest run src/models/services/`
Expected: PASS (ou erros pontuais apenas no mock do ViewModel)

---

### Task 4: Atualização de ViewModels e Componentes (Views)

**Files:**
- Modify: [useContasFixas.ts](../../../src/viewmodels/useContasFixas.ts:75-98)
- Modify: [useDashboardViewModel.ts](../../../src/viewmodels/useDashboardViewModel.ts:416-434)
- Modify: [ContasFixasPanel.vue](../../../src/views/components/ledger/ContasFixasPanel.vue:27-34)
- Modify: [ContasFixasCard.vue](../../../src/views/components/ledger/ContasFixasCard.vue:8,219-224)
- Modify: [PopupLancarContaFixa.vue](../../../src/views/components/ledger/PopupLancarContaFixa.vue:109-156)
- Modify: [BottomSheetConfigurarContaFixa.vue](../../../src/views/components/ledger/BottomSheetConfigurarContaFixa.vue:16,23,51-59,96-105)

- [ ] **Step 1: Ajustar useContasFixas**

Alterar o método `verificarStatusPaga` e `lancarGastoContaFixa` em [useContasFixas.ts](../../../src/viewmodels/useContasFixas.ts):
```typescript
  const verificarStatusPaga = (conta: ContaFixa, gastos: Gasto[]) => {
    const gasto = gastos.find(g => g.recurringBillId === conta.id)
    if (!gasto) return null
    return {
      valorCentavos: gasto.valorTotal.centavos,
      pagoPor: gasto.compradorId
    }
  }

  const lancarGastoContaFixa = async (
    faturaId: string,
    conta: ContaFixa,
    valorCentavos: number,
    compradorId: string,
    participantes: string[]
  ) => {
    await servicoGasto.lancarGastoContaFixa({
      faturaId,
      conta,
      valorCentavos,
      compradorId,
      participantes
    })
  }
```

- [ ] **Step 2: Ajustar useDashboardViewModel**

Alterar `confirmarLancarBill` em [useDashboardViewModel.ts](../../../src/viewmodels/useDashboardViewModel.ts):
```typescript
  const confirmarLancarBill = async (dados: { valorCentavos: number; compradorId: string; splitIds: string[] }) => {
    if (faturaSelecionadaTrancada.value) return
    const activeFaturaId = faturaPixPeriodoSelecionado.value?.id
    if (!activeFaturaId) return
    try {
      await lancarGastoContaFixa(activeFaturaId, billSelecionada.value, dados.valorCentavos, dados.compradorId, dados.splitIds)
      showPopupLancar.value = false
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao lançar conta fixa')
    }
  }

  const confirmarSalvarTemplate = (template: any) => {
    if (faturaSelecionadaTrancada.value) return
    salvarContaFixa(template)
    showBottomSheetConfigCF.value = false
  }
```

- [ ] **Step 3: Ajustar ContasFixasPanel e ContasFixasCard**

Em [ContasFixasPanel.vue](../../../src/views/components/ledger/ContasFixasPanel.vue) no método `obterStatusGasto`:
```typescript
const obterStatusGasto = (conta: ContaFixa) => {
  const g = props.gastos.find(g => g.recurringBillId === conta.id)
  if (!g) return null
  return {
    valorCentavos: g.valorTotal.centavos,
    pagoPor: g.compradorId
  }
}
```
Em [ContasFixasCard.vue](../../../src/views/components/ledger/ContasFixasCard.vue) alterar a prop e o render:
```typescript
  statusGasto: { valorCentavos: number; pagoPor: string } | null
```
E na linha 221:
```html
            R$ {{ (statusGasto.valorCentavos / 100).toFixed(2).replace('.', ',') }} por {{ obterNomeMembro(statusGasto.pagoPor) }}
```

- [ ] **Step 4: Ajustar PopupLancarContaFixa**

Em [PopupLancarContaFixa.vue](../../../src/views/components/ledger/PopupLancarContaFixa.vue):
```typescript
watch(() => props.bill, (newBill) => {
  if (newBill) {
    valorReal.value = newBill.fixedValueCentavos !== null ? newBill.fixedValueCentavos / 100 : 0
    compradorId.value = props.membros[0]?.id || ''
    // ...
```
E na função `confirmar()`:
```typescript
const confirmar = () => {
  emit('confirm', {
    valorCentavos: Math.round((valorReal.value || 0) * 100),
    compradorId: compradorId.value,
    splitIds: splitIds.value
  })
}
```

- [ ] **Step 5: Ajustar BottomSheetConfigurarContaFixa**

Em [BottomSheetConfigurarContaFixa.vue](../../../src/views/components/ledger/BottomSheetConfigurarContaFixa.vue):
```typescript
watch(() => props.bill, (newBill) => {
  if (newBill) {
    name.value = newBill.name
    icon.value = newBill.icon
    fixedValue.value = newBill.fixedValueCentavos !== null ? newBill.fixedValueCentavos / 100 : null
    // ...
```
E na função `salvar()`:
```typescript
const salvar = () => {
  emit('save', {
    id: props.bill?.id || `rec_custom_${Date.now()}`,
    name: name.value,
    icon: icon.value,
    fixedValueCentavos: fixedValue.value && fixedValue.value > 0 ? Math.round(fixedValue.value * 100) : null,
    defaultSplit: defaultSplit.value
  })
}
```

---

### Task 5: Ajustar e Corrigir os Testes Unitários

**Files:**
- Modify: [useContasFixas.test.ts](../../../src/viewmodels/useContasFixas.test.ts)
- Modify: [useDashboardViewModel.test.ts](../../../src/viewmodels/useDashboardViewModel.test.ts)
- Modify: [PopupLancarContaFixa.test.ts](../../../src/views/components/ledger/PopupLancarContaFixa.test.ts)
- Modify: [BottomSheetConfigurarContaFixa.test.ts](../../../src/views/components/ledger/BottomSheetConfigurarContaFixa.test.ts)
- Modify: [ContasFixasPanel.test.ts](../../../src/views/components/ledger/ContasFixasPanel.test.ts)
- Modify: [MigrationService.test.ts](../../../src/models/services/MigrationService.test.ts)

- [ ] **Step 1: Ajustar useContasFixas.test.ts**

Substituir todas as ocorrências de `fixedValue` para `fixedValueCentavos` com os valores em centavos (ex: `100` vira `10000`, `150` vira `15000`, `1500` vira `150000`).
Atualizar a verificação do status de pagamento do teste de `verificarStatusPaga` e `lancarGastoContaFixa`:
```typescript
    expect(status?.valorCentavos).toBe(150000)
    // ...
    await lancarGastoContaFixa('f1', contaAluguel, 150000, 'luciana', ['luciana', 'luan'])
    expect(mockGastoService.lancarGastoContaFixa).toHaveBeenCalledWith({
      faturaId: 'f1',
      conta: contaAluguel,
      valorCentavos: 150000,
      compradorId: 'luciana',
      participantes: ['luciana', 'luan']
    })
```

- [ ] **Step 2: Ajustar useDashboardViewModel.test.ts**

Ajustar as chamadas mocks e asserts para usar centavos puros e `fixedValueCentavos`.

- [ ] **Step 3: Ajustar os testes de componentes de Views**

Atualizar:
- `PopupLancarContaFixa.test.ts`
- `BottomSheetConfigurarContaFixa.test.ts`
- `ContasFixasPanel.test.ts`
Substituindo `fixedValue` por `fixedValueCentavos` nos objetos mockados e assegurando que os assertions reflitam os valores em centavos.

- [ ] **Step 4: Executar testes de ponta a ponta e build**
Run: `npx vitest run`
Expected: 257+ PASS, zero erros.
Run: `npm run build`
Expected: Build com sucesso sem erros de tipagem TypeScript.
