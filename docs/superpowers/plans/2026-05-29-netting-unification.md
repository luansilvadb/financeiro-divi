# Unificação de Netting e Detalhamento Expansível Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar o painel de acertos do período com o netting expansível no Dashboard, fornecendo rastreabilidade de débitos com progresso e suporte a pagamentos parciais no BottomSheet, além de exibir os saldos em rows verticais de forma responsiva.

**Architecture:** Mapeamento reativo de origens de acertos na ViewModel, refatoração de NettingPanel para usar Accordion expansível e barras de progresso, remoção do painel redundante do Dashboard e adaptação do BottomSheet.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Tailwind CSS, Lucide Icons, Vitest.

---

### Task 1: Ajustar a propriedade calculada nettingTransferencias na ViewModel

**Files:**
- Modify: [useDashboardViewModel.ts](file:///c:/teste/financeiro-divi/src/viewmodels/useDashboardViewModel.ts)

- [ ] **Step 1: Injetar `origens` reativas em cada item de `nettingTransferencias`**
  Modificar a propriedade calculada `nettingTransferencias` para anexar um mapeamento de acertos pendentes (faturas fechadas) que correspondem ao devedor (`from`) e credor (`to`) da transação.

  Código para atualizar no bloco do `nettingTransferencias`:
  ```typescript
  const nettingTransferencias = computed(() => {
    const trans = calcularTransacoesNetting(saldosUnificadosAtivosCentavos.value)
    return trans.map(t => {
      // Filtrar acertos pendentes de faturas fechadas correspondentes
      const origens = acertosDaFaturaPeriodo.value.filter(a => {
        const fatura = faturasPeriodoSelecionadoLista.value.find(f => f.id === a.faturaId)
        if (!fatura || fatura.status === 'ABERTA') return false
        
        const responsavelId = fatura.responsavelId
        const fromDevedor = a.tipo === 'MEMBRO_PAGA' ? a.membroId : responsavelId
        const toCredor = a.tipo === 'MEMBRO_PAGA' ? responsavelId : a.membroId
        
        return fromDevedor === t.from && toCredor === t.to && (a.valorAcerto.centavos - (a.valorPago?.centavos || 0)) > 0
      }).map(a => {
        const fatura = faturasPeriodoSelecionadoLista.value.find(f => f.id === a.faturaId)
        const cartaoNome = props.cartoes.find(c => c.id === fatura?.cartaoId)?.nome || 'Cartão'
        const valorPendente = a.valorAcerto.centavos - (a.valorPago?.centavos || 0)
        return {
          id: a.id,
          descricao: `Fatura de ${formatarMesAno(fatura!.periodo.mes, fatura!.periodo.ano)} — ${cartaoNome} (${getMembroNome(fatura!.responsavelId)})`,
          valorTotalCentavos: a.valorAcerto.centavos,
          valorPagoCentavos: a.valorPago?.centavos || 0,
          valorPendenteCentavos: valorPendente
        }
      })
      
      return {
        ...t,
        origens
      }
    })
  })
  ```

- [ ] **Step 2: Verificar a compilação do TypeScript**
  Rodar: `npx tsc --noEmit` para garantir que não há erros de tipagem no ViewModel.

- [ ] **Step 3: Commit das mudanças do ViewModel**
  ```bash
  git add src/viewmodels/useDashboardViewModel.ts
  git commit -m "feat: mapear e injetar origens de acertos no nettingTransferencias"
  ```

---

### Task 2: Refatorar o NettingPanel para exibir Accordions e Progresso

**Files:**
- Modify: [NettingPanel.vue](file:///c:/teste/financeiro-divi/src/views/components/ledger/dashboard/NettingPanel.vue)

- [ ] **Step 1: Atualizar o template e lógica com Accordion**
  Modificar o componente para suportar a expansão de cards e renderizar a lista de `origens` com barra de progresso.
  
  Código a ser aplicado em `NettingPanel.vue`:
  ```vue
  <script setup lang="ts">
  import { ref } from 'vue'
  import { Sparkles, ArrowUpRight, ChevronDown } from 'lucide-vue-next'
  import Card from '../../ui/Card.vue'
  import Button from '../../ui/Button.vue'

  defineProps<{
    nettingTransferencias: any[]
    faturaSelecionadaTrancada: boolean
    getMembroNome: (id: string) => string
  }>()

  const emit = defineEmits<{
    (e: 'abrirNetting', transferencia: any): void
  }>()

  const expandedItems = ref<Record<string, boolean>>({})

  const toggleAccordion = (key: string) => {
    expandedItems.value[key] = !expandedItems.value[key]
  }

  const formatarValor = (centavos: number) => {
    return (centavos / 100).toFixed(2).replace('.', ',')
  }
  </script>

  <template>
    <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite border-l-4 border-l-ember">
      <!-- Cabeçalho Padronizado -->
      <div class="p-6 border-b border-stone bg-parchment flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-midnight text-white flex items-center justify-center">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-lg leading-tight text-charcoal">Acertos Otimizados</h3>
            <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
              Compensação inteligente de dívidas
            </p>
          </div>
        </div>
      </div>

      <div class="p-6 grid gap-4">
        <div 
          v-for="t in nettingTransferencias" 
          :key="t.from + '-' + t.to" 
          class="border border-stone bg-canvas shadow-none rounded-xl overflow-hidden transition-all duration-300"
        >
          <!-- Cabeçalho do Card (Clicável para expandir) -->
          <div 
            class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-black/[0.01]"
            @click="toggleAccordion(t.from + '-' + t.to)"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-ember/10 flex items-center justify-center shrink-0">
                <ArrowUpRight class="w-5 h-5 text-ember" />
              </div>
              <div>
                <p class="text-sm leading-relaxed">
                  <span class="font-bold text-charcoal">{{ getMembroNome(t.from) }}</span> 
                  deve enviar para 
                  <span class="font-bold text-charcoal">{{ getMembroNome(t.to) }}</span>
                </p>
                <p class="font-display text-2xl text-ember mt-1">
                  R$ {{ t.val.toFixed(2).replace('.', ',') }}
                </p>
              </div>
            </div>
            
            <div class="w-full md:w-auto flex items-center justify-between md:justify-end gap-4" @click.stop>
              <div class="flex flex-col items-center w-full md:w-auto">
                <Button 
                  @click="emit('abrirNetting', t)"
                  :disabled="faturaSelecionadaTrancada"
                  :aria-disabled="faturaSelecionadaTrancada"
                  :aria-describedby="faturaSelecionadaTrancada ? 'netting-disabled-reason-' + t.from + '-' + t.to : undefined"
                  variant="primary"
                  class="w-full md:w-auto"
                >
                  Confirmar Pix
                </Button>
                <p v-if="faturaSelecionadaTrancada" :id="'netting-disabled-reason-' + t.from + '-' + t.to" class="text-[10px] text-ash mt-1.5 text-center max-w-[150px] leading-tight">
                  Reabra o mês para confirmar
                </p>
              </div>
              <button 
                class="p-1 hover:bg-stone rounded-full transition-transform duration-300"
                :class="{ 'rotate-180': expandedItems[t.from + '-' + t.to] }"
                @click="toggleAccordion(t.from + '-' + t.to)"
                aria-label="Detalhar composição da dívida"
              >
                <ChevronDown class="w-5 h-5 text-ash" />
              </button>
            </div>
          </div>

          <!-- Detalhamento / Origens Expansíveis -->
          <div 
            v-if="expandedItems[t.from + '-' + t.to]" 
            class="px-5 pb-5 pt-3 border-t border-stone bg-stone/20 space-y-4 animate-in fade-in slide-in-from-top-2"
          >
            <p class="text-[10px] font-bold text-ash uppercase tracking-widest">Origem do Débito</p>
            
            <div v-if="t.origens && t.origens.length > 0" class="space-y-4">
              <div v-for="origem in t.origens" :key="origem.id" class="space-y-2">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-charcoal font-medium">{{ origem.descricao }}</span>
                  <span class="text-ash font-semibold">
                    R$ {{ formatarValor(origem.valorPagoCentavos) }} de R$ {{ formatarValor(origem.valorTotalCentavos) }}
                  </span>
                </div>
                <div class="h-1.5 w-full bg-stone rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-ember to-royal transition-all duration-500" 
                    :style="{ width: `${(origem.valorPagoCentavos / origem.valorTotalCentavos) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-xs text-ash italic">
              Dívida dinâmica calculada com base nos gastos comuns ativos deste mês.
            </div>
          </div>
        </div>
      </div>
    </Card>
  </template>
  ```

- [ ] **Step 2: Commit das mudanças do NettingPanel**
  ```bash
  git add src/views/components/ledger/dashboard/NettingPanel.vue
  git commit -m "feat: refatorar NettingPanel para usar accordion expansível com detalhamento"
  ```

---

### Task 3: Descontinuar Painel de Acertos do Período no DashboardSaldos

**Files:**
- Modify: [DashboardSaldos.vue](file:///c:/teste/financeiro-divi/src/views/screens/DashboardSaldos.vue)

- [ ] **Step 1: Remover a renderização do bloco de Acertos do Período**
  Apagar as linhas 322 a 418 de `DashboardSaldos.vue` que renderizam a seção `<section v-if="faturaAtivaVisualizada && faturaAtivaVisualizada.status !== 'ABERTA' ...">`.

- [ ] **Step 2: Verificar a compilação geral e execução**
  Rodar: `npx tsc --noEmit` para validar que nenhum componente/função parou de compilar.

- [ ] **Step 3: Commit das mudanças do DashboardSaldos**
  ```bash
  git add src/views/screens/DashboardSaldos.vue
  git commit -m "refactor: remover painel redundante de acertos do período do Dashboard"
  ```

---

### Task 4: Corrigir e Adaptar os Testes Unitários

**Files:**
- Modify: [DashboardSaldos.test.ts](file:///c:/teste/financeiro-divi/src/views/screens/DashboardSaldos.test.ts)

- [ ] **Step 1: Adaptar o teste de exibição de faturas fechadas aguardando acerto**
  Como o painel antigo de acertos foi removido, o teste `'deve exibir as faturas fechadas aguardando acerto'` deve ser atualizado para buscar a transferência netting gerada e validar a exibição.

  Código para atualizar o teste em `DashboardSaldos.test.ts`:
  ```typescript
  it('deve exibir as faturas fechadas aguardando acerto', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'FECHADA', periodo: { mes: 5, ano: 2026 } }] as any,
        acertosPendentes: [{ id: 'a1', faturaId: 'f1', membroId: 'm2', valorAcerto: { centavos: 8000 }, tipo: 'MEMBRO_PAGA', pago: false }] as any,
        faturasAbertas: [] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 0
      }
    })

    await wrapper.vm.$nextTick()

    // O netting deve processar a fatura fechada e gerar a transferência correspondente
    expect(wrapper.text()).toContain('Maria')
    expect(wrapper.text()).toContain('João')
    expect(wrapper.text()).toContain('R$ 80,00')
  })
  ```

- [ ] **Step 2: Rodar a suíte inteira de testes**
  Rodar: `npx vitest run`
  Certificar-se de que 100% dos testes passam.

- [ ] **Step 3: Commit dos testes**
  ```bash
  git add src/views/screens/DashboardSaldos.test.ts
  git commit -m "test: adaptar testes de faturas fechadas para refletir unificação no netting"
  ```
