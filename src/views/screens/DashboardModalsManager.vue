<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import BottomSheetFecharFatura from '../components/ledger/dashboard/BottomSheetFecharFatura.vue'
import PopupLancarContaFixa from '../components/ledger/PopupLancarContaFixa.vue'
import BottomSheetConfigurarContaFixa from '../components/ledger/BottomSheetConfigurarContaFixa.vue'
import BottomSheetAcertoCompensacao from '../components/ledger/dashboard/BottomSheetAcertoCompensacao.vue'
import BottomSheetAjustarGasto from '../components/ledger/BottomSheetAjustarGasto.vue'
import BottomSheetConfirmacaoEstorno from '../components/ledger/BottomSheetConfirmacaoEstorno.vue'
import BottomSheet from '../components/ui/BottomSheet.vue'
import Button from '../components/ui/Button.vue'
import { AlertTriangle, ChevronDown, Lock, Home, Check, Copy, LogOut } from 'lucide-vue-next'

const props = defineProps<{
  vm: any
  membrosAtivos: any[]
  cartoes: any[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  casasMultitenant: any
}>()

const localContasFixas = computed(() => {
  const c = props.vm.contasFixas
  return Array.isArray(c) ? c : (c?.value || [])
})

const localGastosFaturaSelecionada = computed(() => {
  const g = props.vm.gastosFaturaSelecionada
  return Array.isArray(g) ? g : (g?.value || [])
})

const nomeNovoPeriodoStr = computed(() => {
  const n = props.vm.nomeNovoPeriodo
  return typeof n === 'string' ? n : (n?.value || '')
})

const localMesesAbertosOpcoes = computed(() => {
  const o = props.vm.mesesAbertosOpcoes
  return Array.isArray(o) ? o : (o?.value || [])
})

const localMesesTrancadosOpcoes = computed(() => {
  const o = props.vm.mesesTrancadosOpcoes
  return Array.isArray(o) ? o : (o?.value || [])
})

const localPeriodoSelecionado = computed(() => {
  const p = props.vm.periodoSelecionado
  if (!p) return null
  return p.value !== undefined ? p.value : p
})

const localItemParaEstornar = computed(() => {
  const item = props.vm.itemParaEstornar
  if (!item) return null
  return item.value !== undefined ? item.value : item
})

const localItemTypeParaEstornar = computed(() => {
  const t = props.vm.itemTypeParaEstornar
  if (!t) return ''
  return t.value !== undefined ? t.value : t
})

const localNettingTarget = computed(() => {
  const t = props.vm.nettingTarget
  if (!t) return null
  return t.value !== undefined ? t.value : t
})

const localFaturaParaFechar = computed(() => {
  const f = props.vm.faturaParaFechar
  if (!f) return null
  return f.value !== undefined ? f.value : f
})

const localBillSelecionada = computed(() => {
  const b = props.vm.billSelecionada
  if (!b) return null
  return b.value !== undefined ? b.value : b
})

const localGastoParaAjustar = computed(() => {
  const g = props.vm.gastoParaAjustar
  if (!g) return null
  return g.value !== undefined ? g.value : g
})

const localFaturaAtivaVisualizada = computed(() => {
  const f = props.vm.faturaAtivaVisualizada
  if (!f) return null
  return f.value !== undefined ? f.value : f
})

const localTotalPeriodoSelecionado = computed(() => {
  const t = props.vm.totalPeriodoSelecionado
  return t.value !== undefined ? t.value : t
})

const localTotalLancamentosPeriodoSelecionado = computed(() => {
  const t = props.vm.totalLancamentosPeriodoSelecionado
  return t.value !== undefined ? t.value : t
})

const localNettingTransferencias = computed(() => {
  const t = props.vm.nettingTransferencias
  return Array.isArray(t) ? t : (t?.value || [])
})

const selecionarPeriodo = (p: { mes: number; ano: number }) => {
  if (props.vm.periodoSelecionado && props.vm.periodoSelecionado.value !== undefined) {
    props.vm.periodoSelecionado.value = p
  } else if (props.vm.periodoSelecionado) {
    props.vm.periodoSelecionado = p
  }
}

const itemSelecionadoRef = ref<any>(null)
const setItemSelecionadoRef = (el: any, op: { mes: number; ano: number }) => {
  const p = localPeriodoSelecionado.value
  if (el && p && p.mes === op.mes && p.ano === op.ano) {
    itemSelecionadoRef.value = el
  }
}

const localIsDropdownAbertosOpen = computed(() => {
  const o = props.vm.isDropdownAbertosOpen
  return typeof o === 'boolean' ? o : (o?.value || false)
})

const toggleDropdownAbertos = () => {
  if (props.vm.isDropdownAbertosOpen && props.vm.isDropdownAbertosOpen.value !== undefined) {
    props.vm.isDropdownAbertosOpen.value = !props.vm.isDropdownAbertosOpen.value
  } else if (props.vm.isDropdownAbertosOpen !== undefined) {
    props.vm.isDropdownAbertosOpen = !props.vm.isDropdownAbertosOpen
  }
}

const fecharDropdownAbertos = () => {
  if (props.vm.isDropdownAbertosOpen && props.vm.isDropdownAbertosOpen.value !== undefined) {
    props.vm.isDropdownAbertosOpen.value = false
  } else if (props.vm.isDropdownAbertosOpen !== undefined) {
    props.vm.isDropdownAbertosOpen = false
  }
}

watch(localIsDropdownAbertosOpen, async (aberto) => {
  if (aberto) {
    await nextTick()
    if (itemSelecionadoRef.value && typeof itemSelecionadoRef.value.scrollIntoView === 'function') {
      itemSelecionadoRef.value.scrollIntoView({ block: 'nearest' })
    }
  }
})


</script>

<template>
  <div>
    <!-- BottomSheet de Fechamento de Fatura -->
    <BottomSheetFecharFatura 
      :show="vm.isModalNoTopo('fechar-fatura')"
      :fatura="localFaturaParaFechar"
      :membros="membrosAtivos"
      @close="vm.fecharModal('fechar-fatura')"
      @confirmar="vm.confirmarFechamentoFatura"
    />

    <!-- Popup Lancar Conta Fixa -->
    <PopupLancarContaFixa 
      :visible="vm.isModalNoTopo('lancar-conta-fixa')"
      :bill="localBillSelecionada"
      :membros="membrosAtivos"
      @confirm="vm.confirmarLancarBill"
      @cancel="vm.fecharModal('lancar-conta-fixa')"
    />

    <!-- Configurar Conta Fixa -->
    <BottomSheetConfigurarContaFixa 
      :visible="vm.isModalNoTopo('configurar-conta-fixa')"
      :bill="localBillSelecionada"
      :membros="membrosAtivos"
      @save="vm.confirmarSalvarTemplate"
      @delete="vm.abrirConfirmacaoEstornoBill"
      @cancel="vm.fecharModal('configurar-conta-fixa')"
    />

    <!-- Novo Período -->
    <BottomSheet :model-value="vm.isModalNoTopo('novo-periodo')" @update:model-value="val => { if (!val) vm.fecharModal('novo-periodo') }" width-class="md:w-[460px]" max-height="95dvh">
      <div class="p-6 sm:p-8 space-y-8 flex-grow overflow-y-auto custom-scrollbar">
        <div class="space-y-3">
          <h3 class="text-3xl font-display text-charcoal leading-tight">Fechamento<br>de <span class="text-ember">Período</span></h3>
          <p class="text-sm text-ash leading-relaxed">
            Revise os números antes de arquivar o mês de <strong class="text-charcoal">{{ localFaturaAtivaVisualizada?.periodo ? vm.formatarMesAno(localFaturaAtivaVisualizada.periodo.mes, localFaturaAtivaVisualizada.periodo.ano) : '' }}</strong>. O saldo será consolidado e os acertos serão gerados automaticamente.
          </p>
        </div>

        <div v-if="localFaturaAtivaVisualizada" class="grid grid-cols-2 gap-3">
          <div class="bg-parchment p-4 rounded-xl border border-stone">
            <p class="text-[10px] font-bold uppercase text-ash tracking-widest mb-1">Total do Mês</p>
            <p class="text-2xl font-display text-charcoal break-words">R$ {{ vm.formatarDinheiro(localTotalPeriodoSelecionado).toFixed(2).replace('.', ',') }}</p>
            <p class="text-[10px] text-ash font-medium mt-1">{{ localTotalLancamentosPeriodoSelecionado }} lançamentos registrados</p>
          </div>
          
          <div class="bg-parchment p-4 rounded-xl border border-stone">
            <p class="text-[10px] font-bold uppercase text-ash tracking-widest mb-1">Impacto (Pix)</p>
            <p class="text-2xl font-display text-ember">{{ localNettingTransferencias.length }} Acertos</p>
            <p class="text-[10px] text-ash font-medium mt-1">serão cobrados dos moradores</p>
          </div>
        </div>

        <div v-if="localFaturaAtivaVisualizada && localContasFixas.some((c: any) => !localGastosFaturaSelecionada.some((g: any) => g.recurringBillId === c.id))" class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
          <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <p class="text-xs font-bold text-amber-700">Contas fixas pendentes!</p>
            <p class="text-[11px] text-amber-700/80 mt-0.5">Ainda existem contas fixas deste mês que não foram lançadas. Deseja fechar mesmo assim?</p>
          </div>
        </div>
      </div>

      <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
        <div class="grid grid-cols-2 gap-3">
          <Button variant="secondary" @click="vm.fecharModal('novo-periodo')">Cancelar</Button>
          <Button variant="primary" class="bg-charcoal text-white hover:bg-midnight border-none" @click="vm.confirmarNovoPeriodo" :disabled="!nomeNovoPeriodoStr.trim()">
            Arquivar Mês
          </Button>
        </div>
      </div>
    </BottomSheet>

    <!-- Netting Otimizado -->
    <BottomSheetAcertoCompensacao 
      :visible="vm.isModalNoTopo('netting')"
      :from-id="localNettingTarget?.from"
      :to-id="localNettingTarget?.to"
      :from-name="vm.getMembroNome(localNettingTarget?.from)"
      :to-name="vm.getMembroNome(localNettingTarget?.to)"
      :suggested-value="localNettingTarget?.val || 0"
      @cancel="vm.fecharModal('netting')"
      @confirm="vm.confirmarBaixaNetting"
    />

    <!-- Ajuste de Lançamento -->
    <BottomSheetAjustarGasto 
      :visible="vm.isModalNoTopo('ajustar-gasto')"
      :gasto="localGastoParaAjustar"
      :membros="props.membrosAtivos"
      :cartoes="cartoes"
      :faturas="[...faturasAbertas, ...faturasFechadas]"
      @cancel="vm.fecharModal('ajustar-gasto')"
      @save="vm.confirmarAjusteGasto"
    />

    <!-- Navegação de Histórico -->
    <BottomSheet 
      :model-value="vm.isModalNoTopo('historico')" 
      @update:model-value="val => { if (!val) vm.fecharModal('historico') }" 
      width-class="md:w-[460px]"
      max-height="85dvh"
    >
      <div class="p-6 sm:p-8 space-y-6 flex-grow custom-scrollbar" :class="localIsDropdownAbertosOpen ? 'overflow-y-visible' : 'overflow-y-auto'">
        <div class="space-y-3">
          <h3 class="text-3xl font-display text-charcoal leading-tight">Navegar<br>nos <span class="text-ember">Períodos</span></h3>
          <p class="text-xs text-ash leading-relaxed">
            Selecione o mês que você deseja gerenciar. Todos os meses estão abertos para lançamentos até serem fechados.
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Gerenciar Período Aberto</h4>
          <div class="relative" @blur="fecharDropdownAbertos">
            <div 
              @click="toggleDropdownAbertos"
              @keydown.enter.prevent="toggleDropdownAbertos"
              @keydown.space.prevent="toggleDropdownAbertos"
              aria-label="Gerenciar período aberto"
              role="button"
              tabindex="0"
              :aria-expanded="localIsDropdownAbertosOpen ? 'true' : 'false'"
              class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal cursor-pointer flex justify-between items-center"
            >
              <span class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-meadow animate-pulse" />
                <span class="block truncate">
                  {{ (localPeriodoSelecionado && faturasFechadas.every(f => f.periodo.mes !== localPeriodoSelecionado.mes || f.periodo.ano !== localPeriodoSelecionado.ano))
                    ? vm.formatarMesAno(localPeriodoSelecionado.mes, localPeriodoSelecionado.ano)
                    : 'Selecionar mês aberto...'
                  }}
                </span>
              </span>
              <ChevronDown class="w-4 h-4 text-ash pointer-events-none transition-transform duration-200" :class="localIsDropdownAbertosOpen ? 'rotate-180' : ''" />
            </div>
            
            <transition name="dropdown-slide">
              <div v-if="localIsDropdownAbertosOpen" class="absolute left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-canvas border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar">
                <div 
                  v-for="op in localMesesAbertosOpcoes" 
                  :key="op.nome" 
                  :ref="el => setItemSelecionadoRef(el, op)"
                  @mousedown.prevent="selecionarPeriodo({ mes: op.mes, ano: op.ano }); fecharDropdownAbertos(); vm.fecharModal('historico')" 
                  @keydown.enter.prevent="selecionarPeriodo({ mes: op.mes, ano: op.ano }); fecharDropdownAbertos(); vm.fecharModal('historico')"
                  @keydown.space.prevent="selecionarPeriodo({ mes: op.mes, ano: op.ano }); fecharDropdownAbertos(); vm.fecharModal('historico')"
                  role="button"
                  tabindex="0"
                  class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors flex items-center gap-3"
                  :class="localPeriodoSelecionado?.mes === op.mes && localPeriodoSelecionado?.ano === op.ano ? 'text-ember bg-ember/5' : 'text-charcoal'"
                >
                  <span class="w-2 h-2 rounded-full bg-meadow animate-pulse shrink-0" />
                  {{ op.nome }}
                </div>
              </div>
            </transition>
          </div>
        </div>

        <hr class="border-stone/60 my-6" />

        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Histórico de Fechados (Arquivados)</h4>
          <div class="grid gap-2">
            <div 
              v-for="item in localMesesTrancadosOpcoes" 
              :key="item.nome"
              @click="selecionarPeriodo({ mes: item.mes, ano: item.ano }); vm.fecharModal('historico')"
              @keydown.enter.prevent="selecionarPeriodo({ mes: item.mes, ano: item.ano }); vm.fecharModal('historico')"
              @keydown.space.prevent="selecionarPeriodo({ mes: item.mes, ano: item.ano }); vm.fecharModal('historico')"
              :aria-label="'Selecionar período arquivado ' + item.nome"
              role="button"
              tabindex="0"
              class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
              :class="localPeriodoSelecionado?.mes === item.mes && localPeriodoSelecionado?.ano === item.ano ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas text-charcoal'"
            >
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-ash" />
                <span class="text-sm font-semibold">{{ item.nome }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] uppercase font-bold text-ash">Arquivado</span>
                <Lock class="w-3.5 h-3.5 text-ash shrink-0" />
              </div>
            </div>
            
            <div v-if="localMesesTrancadosOpcoes.length === 0" class="text-center py-6 border border-dashed border-stone rounded-xl">
              <p class="text-xs text-ash italic">Nenhum período arquivado ainda.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
        <Button variant="secondary" class="w-full" @click="vm.fecharModal('historico')">Fechar</Button>
      </div>
    </BottomSheet>

    <!-- Confirmação de Estorno -->
    <BottomSheetConfirmacaoEstorno 
      :visible="vm.isModalNoTopo('confirmacao-estorno')"
      :item-type="localItemTypeParaEstornar"
      :item-name="localItemParaEstornar?.descricao || localItemParaEstornar?.name"
      :item-value="localItemParaEstornar?.valorTotal ? localItemParaEstornar?.valorTotal.centavos / 100 : localItemParaEstornar?.defaultAmount"
      @cancel="vm.fecharModal('confirmacao-estorno')"
      @confirm="vm.confirmarEstorno"
    />

    <!-- Gerenciamento de Casas -->
    <BottomSheet 
      :model-value="vm.isModalNoTopo('casas')" 
      @update:model-value="val => { if (!val) vm.fecharModal('casas') }" 
      width-class="md:w-[460px]"
      max-height="90dvh"
    >
      <div class="p-6 sm:p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar flex flex-col text-graphite">
        <div class="space-y-3">
          <h3 class="text-3xl font-display text-charcoal leading-tight">Minhas <span class="text-ember">Casas</span></h3>
          <p class="text-xs text-ash leading-relaxed">
            Selecione uma casa ativa ou gerencie seus grupos financeiros. Compartilhe o código de convite para trazer novos membros.
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Alternar de Casa</h4>
          <div class="grid gap-2">
            <div 
              v-for="casa in casasMultitenant.casas" 
              :key="casa.id"
              @click="casasMultitenant.selecionarCasa(casa.id)"
              class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
              :class="casasMultitenant.activeTenantId === casa.id ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas text-charcoal'"
            >
              <div class="flex items-center gap-3">
                <Home class="w-4 h-4 shrink-0" :class="casasMultitenant.activeTenantId === casa.id ? 'text-ember' : 'text-ash'" />
                <span class="text-sm font-semibold">{{ casa.name }}</span>
              </div>
              <div class="flex items-center gap-2" @click.stop>
                <code class="text-[10px] bg-stone/50 px-2 py-1 rounded text-ash font-mono select-all">
                  {{ casa.invite_code }}
                </code>
                <button 
                  @click="casasMultitenant.copyInviteCode(casa.invite_code)" 
                  class="p-1 hover:bg-stone rounded transition-colors"
                >
                  <Check v-if="casasMultitenant.copied" class="w-3.5 h-3.5 text-meadow" />
                  <Copy v-else class="w-3.5 h-3.5 text-ash" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-stone/60 my-6" />

        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Criar Nova Casa</h4>
          <div class="flex gap-2">
            <input 
              v-model="casasMultitenant.nomeNovaCasa"
              placeholder="Ex: República Central"
              class="flex-1 bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-2 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00]"
            />
            <Button size="sm" @click="casasMultitenant.criarNovaCasa">Criar</Button>
          </div>
        </div>

        <div class="space-y-3 pt-2">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Entrar com Código</h4>
          <div class="flex gap-2">
            <input 
              v-model="casasMultitenant.codigoConvite"
              placeholder="Ex: CASA-7F2A1"
              class="flex-1 bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-2 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00]"
            />
            <Button size="sm" @click="casasMultitenant.entrarPorCodigo">Entrar</Button>
          </div>
        </div>

        <div v-if="casasMultitenant.errorCasa" class="text-xs text-coral font-semibold pt-2">
          {{ casasMultitenant.errorCasa }}
        </div>
      </div>
      
      <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0 flex justify-between items-center">
        <button 
          @click="casasMultitenant.handleLogoutClick" 
          class="flex items-center gap-2 text-xs font-bold text-coral hover:underline focus:outline-none"
        >
          <LogOut class="w-4 h-4" />
          Sair da Conta
        </button>
        <Button variant="secondary" @click="vm.fecharModal('casas')">Fechar</Button>
      </div>
    </BottomSheet>
  </div>
</template>
