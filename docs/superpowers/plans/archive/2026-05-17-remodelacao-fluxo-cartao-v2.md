# Remodelação do Fluxo de Cartão de Crédito v2 - Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as 6 melhorias de experiência de ciclo de cartões (renomear labels, tela de revisão de extrato, divisão opcional na compra, acertos para 3+ membros, histórico de faturas e override do dono da fatura no fechamento) garantindo cobertura de testes.

**Architecture:** A arquitetura preserva as entidades e regras matemáticas de domínio e insere componentes auxiliares interativos na UI do Vue 3, estendendo os serviços de aplicação com sobrecargas limpas e interfaces flexíveis.

**Tech Stack:** Vue 3, Composition API, TypeScript, Vitest, TailwindCSS, LocalStorage, StorageLock.

---

### Task 1: Ajuste de Linguagem na UI (Gap 1)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`

- [ ] **Step 1: Renomear strings no composable do wizard**
Alterar a linguagem técnica de "Adiantamento" para "Pagamento Antecipado".
Show code changes:
```typescript
// Em src/modules/ledger/composables/useNovoLancamentoWizard.ts:
// Alterar apenas o tipo ou labels se exibidos por métodos, mas mantendo a propriedade interna 'tipo' como 'ADIANTAMENTO' no domínio
// Mudar apenas comentários ou lógica de retorno na UI. Nada no tipo técnico
```

- [ ] **Step 2: Atualizar os labels e textos de ajuda no template do Wizard**
Modificar os botões e textos do fluxo em `src/components/ledger/NovoLancamentoWizard.vue` para usarem a linguagem de "Pagamento Antecipado".
Substituir:
- "Registrar Adiantamento" por "Registrar Pagamento Antecipado"
- "Registrar transferência de dinheiro para o dono do cartão" por "Paguei uma conta da casa antes do fechamento"
- "Quem está adiantando o dinheiro?" por "Quem está pagando?"
- "Para qual cartão/fatura?" por "Para qual cartão/fatura é a conta?"
- "Qual o valor do adiantamento?" por "Qual o valor pago?"
- "Qual o valor do adiantamento?" por "Qual o valor pago?"
- "Valor Adiantado (Pix)" por "Valor Pago (Pix/Dinheiro)"

- [ ] **Step 3: Executar testes do Wizard para verificar regressões**
Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue src/modules/ledger/composables/useNovoLancamentoWizard.ts
git commit -m "feat: renomear adiantamento para pagamento antecipado na UI (Gap 1)"
```

---

### Task 2: Extensão do Domínio para Override do Dono da Fatura (Gap 6)

**Files:**
- Modify: `src/modules/ledger/core/domain/Fatura.ts`
- Modify: `src/modules/ledger/core/services/FaturaService.ts`
- Modify: `src/modules/ledger/core/services/FaturaService.test.ts`

- [ ] **Step 1: Adicionar override opcional em Fatura.fechar**
Modificar o método `fechar` na entidade `Fatura` para permitir reatribuir o responsavelId no momento do fechamento.
```typescript
// Em src/modules/ledger/core/domain/Fatura.ts
fechar(responsavelId?: string, dataPagamentoBanco?: Date) {
  if (this._status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
  this._status = 'FECHADA'
  this._dataPagamentoBanco = dataPagamentoBanco
  if (responsavelId) {
    // Para contornar o readonly do construtor, podemos reatribuir internamente
    // se transformarmos o campo responsavelId em getter ou propriedade mutável.
    // Vamos transformar responsavelId em propriedade mutável no domínio:
    // public responsavelId: string -> public _responsavelId: string; get responsavelId() { return this._responsavelId }
  }
}
```
Vamos alterar `src/modules/ledger/core/domain/Fatura.ts`:
```typescript
// Modificar na classe Fatura:
public responsavelId: string
// ... vira:
private _responsavelId: string
get responsavelId(): string { return this._responsavelId }
// E no fechar:
fechar(responsavelId?: string, dataPagamentoBanco?: Date) {
  if (this._status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
  this._status = 'FECHADA'
  this._dataPagamentoBanco = dataPagamentoBanco
  if (responsavelId) {
    this._responsavelId = responsavelId
  }
}
```

- [ ] **Step 2: Atualizar FaturaProps e FaturaService.fecharFatura**
Modificar `fecharFatura` no serviço `FaturaService.ts` para receber o `responsavelId`:
```typescript
// Em src/modules/ledger/core/services/FaturaService.ts
async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
  const fatura = await this.faturaRepo.buscarPorId(faturaId)
  if (!fatura) throw new Error('Fatura não encontrada')

  fatura.fechar(responsavelId, dataPagamentoBanco)
  await this.faturaRepo.salvar(fatura)
}
```

- [ ] **Step 3: Ajustar o teste unitário de FaturaService**
Modificar `src/modules/ledger/core/services/FaturaService.test.ts` para testar o fechamento com e sem o override de `responsavelId`.
```typescript
it('deve fechar a fatura com override de responsavelId', async () => {
  const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
  const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
  const service = new FaturaService(faturaRepo as any, {} as any, {} as any, {} as any)
  
  await service.fecharFatura('f1', 'm2', new Date())
  
  expect(fatura.status).toBe('FECHADA')
  expect(fatura.responsavelId).toBe('m2')
})
```

- [ ] **Step 4: Executar testes de serviço**
Run: `npx vitest run src/modules/ledger/core/services/FaturaService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/ledger/core/domain/Fatura.ts src/modules/ledger/core/services/FaturaService.ts src/modules/ledger/core/services/FaturaService.test.ts
git commit -m "feat: suporte a override de responsavelId no fechamento da fatura (Gap 6)"
```

---

### Task 3: Listar Faturas por Status no Repositório (Gap 5)

**Files:**
- Modify: `src/modules/ledger/core/ports/IFaturaRepository.ts`
- Modify: `src/modules/ledger/adapters/LocalStorageFaturaRepository.ts`

- [ ] **Step 1: Adicionar listarTodas na porta IFaturaRepository**
Adicionar a assinatura na interface para podermos listar de forma limpa.
```typescript
// Em src/modules/ledger/core/ports/IFaturaRepository.ts
export interface IFaturaRepository {
  buscarPorId(id: string): Promise<Fatura | null>
  buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null>
  salvar(fatura: Fatura): Promise<void>
  listarTodas(): Promise<Fatura[]> // <- Adicionar
}
```

- [ ] **Step 2: Certificar que o Adapter implementa listarTodas na classe**
O `LocalStorageFaturaRepository.ts` já implementa `listarTodas()`, então basta garantir que ele está exposto na assinatura pública da classe.

- [ ] **Step 3: Rodar testes da Fatura**
Run: `npx vitest run src/modules/ledger/core/domain/Fatura.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/modules/ledger/core/ports/IFaturaRepository.ts src/modules/ledger/adapters/LocalStorageFaturaRepository.ts
git commit -m "feat: expor listarTodas na interface do FaturaRepository (Gap 5)"
```

---

### Task 4: Passo de Divisão Opcional no Wizard (Gap 3)

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`
- Create: `src/components/ledger/wizard/PassoDivisaoOpcional.vue`

- [ ] **Step 1: Adicionar estados de divisão no composable do wizard**
Adicionar reatividade para controlar se o usuário quer dividir agora, a lista de participantes e os valores de rateio.
```typescript
// Em src/modules/ledger/composables/useNovoLancamentoWizard.ts
const querDividirAgora = ref(false)
const participantesDivisao = ref<string[]>([]) // membroId[]
const modoDivisaoWizard = ref<'IGUAL' | 'MANUAL'>('IGUAL')
const valoresDivisaoWizard = ref<Record<string, number>>({}) // membroId -> valor

// Modificar totalSteps e canAdvance para suportar o passo 5
const totalSteps = computed(() => tipo.value === 'GASTO' && querDividirAgora.value ? 5 : 4)
```

- [ ] **Step 2: Implementar persistência da divisão ao finalizar como Gasto**
Ajustar `finalizarComoGastoCartao` para gravar a divisão configurada ao invés de sempre gravar 100% para o comprador.
```typescript
// Em finalizarComoGastoCartao:
let divisoes: DivisaoDeGasto[] = []
if (querDividirAgora.value && participantesDivisao.value.length > 0) {
  if (modoDivisaoWizard.value === 'IGUAL') {
    const partes = total.distribuir(participantesDivisao.value.length)
    divisoes = participantesDivisao.value.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))
  } else {
    divisoes = participantesDivisao.value.map(id => new DivisaoDeGasto(id, Dinheiro.deReais(valoresDivisaoWizard.value[id] || 0)))
  }
} else {
  divisoes = [new DivisaoDeGasto(compradorSelecionadoId.value, total)]
}
```

- [ ] **Step 3: Criar o componente PassoDivisaoOpcional.vue**
Criar a tela de rateio rápida no wizard com a lista de membros e seleção do valor.
```vue
<!-- Em src/components/ledger/wizard/PassoDivisaoOpcional.vue -->
<template>
  <!-- Renderiza o grid de avatares com checkboxes/clicks reativos e inputs para modo manual -->
</template>
```

- [ ] **Step 4: Integrar o PassoDivisaoOpcional no NovoLancamentoWizard.vue**
Adicionar o Passo 5 condicional e controles de avançar/voltar.

- [ ] **Step 5: Executar testes automatizados do wizard**
Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/modules/ledger/composables/useNovoLancamentoWizard.ts src/components/ledger/NovoLancamentoWizard.vue src/components/ledger/wizard/PassoDivisaoOpcional.vue
git commit -m "feat: passo opcional de divisão no wizard de novo lançamento (Gap 3)"
```

---

### Task 5: Componente de Revisão de Fatura (Gap 2 & Gap 4)

**Files:**
- Create: `src/components/ledger/dashboard/RevisaoFatura.vue`
- Create: `src/components/ledger/dashboard/ListaGastosRevisao.vue`
- Create: `src/components/ledger/dashboard/ModalDivisaoGasto.vue`
- Create: `src/components/ledger/dashboard/PreviaAcertos.vue`
- Modify: `src/modules/ledger/composables/useCartoesEFaturas.ts`

- [ ] **Step 1: Criar composable de cálculo de prévia na revisão**
Adicionar no `useCartoesEFaturas.ts` funções que calculam a prévia temporária dos saldos em tempo real sem persistir os acertos (simulando a consolidação na UI).

- [ ] **Step 2: Criar o ModalDivisaoGasto.vue**
Componente reutilizável para configurar divisões iguais, por valor ou porcentagem.

- [ ] **Step 3: Criar ListaGastosRevisao.vue**
Componente contendo o extrato da fatura fechada sob revisão, listando cada gasto, comprador associado e opções de divisão/troca.

- [ ] **Step 4: Criar PreviaAcertos.vue**
Componente que consome o cálculo em tempo real e exibe cards individuais com setas de quem paga para quem, adaptado para casas com 3+ moradores.

- [ ] **Step 5: Criar o RevisaoFatura.vue**
Componente agregador que junta o extrato, a prévia de acertos e o botão de confirmação definitiva.

- [ ] **Step 6: Executar testes de renderização da UI**
Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add src/components/ledger/dashboard/RevisaoFatura.vue src/components/ledger/dashboard/ListaGastosRevisao.vue src/components/ledger/dashboard/ModalDivisaoGasto.vue src/components/ledger/dashboard/PreviaAcertos.vue src/modules/ledger/composables/useCartoesEFaturas.ts
git commit -m "feat: componentes da tela de revisao de fatura com previa de acertos N membros (Gap 2 & Gap 4)"
```

---

### Task 6: Histórico de Faturas Acertadas (Gap 5)

**Files:**
- Create: `src/components/ledger/dashboard/HistoricoFaturas.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Criar o componente HistoricoFaturas.vue**
Exibe a lista de faturas com status `ACERTADA` recolhida sob um menu sanfona (accordion) colapsável, mostrando detalhes ao expandir.

- [ ] **Step 2: Integrar no DashboardSaldos.vue**
Adicionar a renderização do histórico de faturas no final da página.

- [ ] **Step 3: Testar renderização do Dashboard**
Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/ledger/dashboard/HistoricoFaturas.vue src/components/ledger/DashboardSaldos.vue
git commit -m "feat: secao de historico de faturas acertadas no dashboard (Gap 5)"
```

---

### Task 7: Modal de Fechamento com Dono Variável (Gap 6)

**Files:**
- Create: `src/components/ledger/dashboard/ModalFecharFatura.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Criar o ModalFecharFatura.vue**
Exibe grid de avatares com o responsável padrão pré-selecionado para o usuário decidir quem pagou a fatura ao banco naquele mês.

- [ ] **Step 2: Conectar ação de fechar fatura no DashboardSaldos**
Substituir o clique direto de fechamento pelo modal interativo, que em seguida invoca `fecharFaturaManual(faturaId, responsavelId)`.

- [ ] **Step 3: Testar fluxo de fechamento completo**
Executar a suite de testes inteira do ledger para garantir integridade.
Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/ledger/dashboard/ModalFecharFatura.vue src/components/ledger/DashboardSaldos.vue
git commit -m "feat: modal de fechamento de fatura com definicao de responsavel (Gap 6)"
```

---

## Verificação e Definição de Pronto (DoD)

- [ ] Todos os testes unitários passando.
- [ ] Interface visual testada no navegador e sem erros de console.
- [ ] Fechamento e acerto com override do dono e divisão opcional salvando corretamente no LocalStorage.
