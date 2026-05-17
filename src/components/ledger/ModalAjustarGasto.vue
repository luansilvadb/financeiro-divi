<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'
import Button from '../ui/Button.vue'
import SectionLabel from '../ui/SectionLabel.vue'
import NonModalBottomSheet from '../ui/NonModalBottomSheet.vue'
import { Check, CreditCard, Wallet, Users, Info } from 'lucide-vue-next'

interface Props {
  visible: boolean
  gasto: Gasto | null
  membros: { id: string; nome: string }[]
  cartoes: { id: string; nome: string; responsavelPadraoId: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['cancel', 'save'])

const descInput = ref('')
const valorInput = ref(0)
const quemPaga = ref('')
const activeMethod = ref<'pix' | 'card'>('pix')
const activeCardOwner = ref<string | null>(null)
const selectedSplit = ref<string[]>([])

// Monitora alterações do gasto recebido por prop para sincronizar o formulário
watch(() => props.gasto, (newG) => {
  if (newG) {
    descInput.value = newG.descricao
    valorInput.value = newG.valorTotal.centavos / 100
    quemPaga.value = newG.compradorId
    activeMethod.value = newG.method
    activeCardOwner.value = newG.cardOwner
    selectedSplit.value = newG.divisoes.map(d => d.membroId)
  }
}, { immediate: true })

const selectMethod = (method: 'pix' | 'card', cardOwner: string | null) => {
  activeMethod.value = method
  activeCardOwner.value = cardOwner
}

const toggleSplit = (memberId: string) => {
  const idx = selectedSplit.value.indexOf(memberId)
  if (idx > -1) {
    if (selectedSplit.value.length === 1) return // mínimo 1 participante
    selectedSplit.value.splice(idx, 1)
  } else {
    selectedSplit.value.push(memberId)
  }
}

// Recálculo dinâmico das parcelas do rateio
const calculatedSharesDesc = computed(() => {
  const n = selectedSplit.value.length
  if (n === 0 || valorInput.value <= 0) return 'Digite um valor e selecione participantes'
  const share = valorInput.value / n
  const formatted = share.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  
  if (n === props.membros.length) {
    return `Dividido igualmente com todos. Cada um paga ${formatted}`
  } else if (n === 1) {
    const name = props.membros.find(m => m.id === selectedSplit.value[0])?.nome || ''
    return `Só de ${name}. Assume 100% no valor de ${formatted}`
  } else {
    const names = selectedSplit.value.map(id => props.membros.find(m => m.id === id)?.nome).join(' e ')
    return `Entre ${names}. Cada um paga ${formatted}`
  }
})

const handleConfirm = () => {
  if (!descInput.value.trim()) return
  if (valorInput.value <= 0) return

  const totalCents = Math.round(valorInput.value * 100)
  const floorShare = Math.floor(totalCents / selectedSplit.value.length)
  const divisoes: DivisaoDeGasto[] = []
  
  selectedSplit.value.forEach(mId => {
    divisoes.push(new DivisaoDeGasto(mId, Dinheiro.deCentavos(floorShare)))
  })

  let remainder = totalCents - (floorShare * selectedSplit.value.length)
  let idx = 0
  const order = [...selectedSplit.value]
  
  if (quemPaga.value && order.includes(quemPaga.value)) {
    const index = order.indexOf(quemPaga.value)
    order.splice(index, 1)
    order.unshift(quemPaga.value)
  }

  while (remainder > 0) {
    const targetMemberId = order[idx % order.length]
    const currentDivIdx = divisoes.findIndex(d => d.membroId === targetMemberId)
    if (currentDivIdx > -1) {
      const originalDiv = divisoes[currentDivIdx]
      divisoes[currentDivIdx] = new DivisaoDeGasto(targetMemberId, Dinheiro.deCentavos(originalDiv.valor.centavos + 1))
    }
    remainder--
    idx++
  }

  emit('save', {
    descricao: descInput.value.trim(),
    valorTotal: Dinheiro.deCentavos(totalCents),
    compradorId: quemPaga.value,
    method: activeMethod.value,
    cardOwner: activeCardOwner.value,
    divisoes,
    installments: props.gasto?.installments || 1
  })
}
</script>

<template>
  <NonModalBottomSheet :visible="props.visible" width-class="md:w-[460px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
        <div class="space-y-2 text-center">
          <SectionLabel class="mx-auto">Ajuste</SectionLabel>
          <h3 class="text-3xl font-display text-charcoal">Corrigir <span class="text-ember">Lançamento</span></h3>
        </div>

        <div class="space-y-6">
          <!-- Descrição -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Descrição</label>
            <input 
              type="text" 
              v-model="descInput" 
              class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-sm text-charcoal focus:border-ember transition-all" 
              placeholder="Ex: Supermercado"
            />
          </div>

          <!-- Valor Total -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Valor Total</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ash text-sm font-bold">R$</span>
              <input 
                v-model.number="valorInput"
                type="number"
                step="0.01"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-lg text-charcoal focus:border-ember transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <!-- Canal de Pagamento -->
          <div v-if="!props.gasto?.isLoan" class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Método / Cartão</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                @click="selectMethod('pix', null)"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="activeMethod === 'pix' ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                <Wallet class="w-4 h-4" />
                <span class="text-[9px] font-bold uppercase tracking-wider">Pix</span>
              </button>
              <button 
                @click="selectMethod('card', 'luan')"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="activeMethod === 'card' && activeCardOwner === 'luan' ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                <CreditCard class="w-4 h-4" />
                <span class="text-[9px] font-bold uppercase tracking-wider">Nubank</span>
              </button>
              <button 
                @click="selectMethod('card', 'joao')"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="activeMethod === 'card' && activeCardOwner === 'joao' ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                <CreditCard class="w-4 h-4" />
                <span class="text-[9px] font-bold uppercase tracking-wider">C6</span>
              </button>
            </div>
          </div>

          <!-- Quem pagou -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">
              {{ props.gasto?.isLoan ? 'Quem emprestou?' : activeMethod === 'pix' ? 'Quem fez o Pix?' : `Quem passou no cartão?` }}
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="m in props.membros"
                :key="m.id"
                @click="quemPaga = m.id"
                class="py-3 rounded-xl border font-bold text-xs transition-all duration-200"
                :class="quemPaga === m.id ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                {{ m.nome }}
              </button>
            </div>
          </div>

          <!-- Participantes (Split) -->
          <div v-if="!props.gasto?.isLoan" class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Dividir com</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="m in props.membros"
                :key="m.id"
                @click="toggleSplit(m.id)"
                class="relative py-4 rounded-xl border font-bold text-xs transition-all duration-200 flex flex-col items-center gap-2"
                :class="selectedSplit.includes(m.id) ? 'bg-[#ff3e00]/5 border-[#ff3e00] text-[#ff3e00] font-bold' : 'bg-[#f6f4ef] border-stone-surface text-ash hover:bg-stone-surface'"
              >
                <Users class="w-4 h-4" />
                <span>{{ m.nome }}</span>
                <div v-if="selectedSplit.includes(m.id)" class="absolute top-1.5 right-1.5">
                  <Check class="w-3 h-3 text-[#ff3e00]" />
                </div>
              </button>
            </div>
          </div>

          <!-- Quadro Final / Prévia do Rateio -->
          <div v-if="!props.gasto?.isLoan" class="flex gap-4 p-4 rounded-xl bg-meadow-green/5 border border-meadow-green/20 text-meadow-green">
            <Info class="w-5 h-5 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <p class="text-[10px] font-bold uppercase tracking-widest">Resumo do Rateio</p>
              <p class="text-xs font-semibold leading-relaxed">{{ calculatedSharesDesc }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-surface">
          <Button variant="secondary" @click="emit('cancel')">Voltar</Button>
          <Button variant="primary" @click="handleConfirm" :disabled="!descInput.trim() || valorInput <= 0">Salvar</Button>
        </div>
    </div>
  </NonModalBottomSheet>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone-surface);
  border-radius: 9999px;
}
</style>
