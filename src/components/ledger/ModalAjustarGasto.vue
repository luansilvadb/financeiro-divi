<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'

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

const getCardLabel = (co: string) => {
  return co === 'luan' ? 'Nubank' : 'C6'
}

const handleConfirm = () => {
  if (!descInput.value.trim()) return
  if (valorInput.value <= 0) return

  // Criar divisões corretas distribuindo centavos
  const totalCents = Math.round(valorInput.value * 100)
  const floorShare = Math.floor(totalCents / selectedSplit.value.length)
  const divisoes: DivisaoDeGasto[] = []
  
  selectedSplit.value.forEach(mId => {
    divisoes.push(new DivisaoDeGasto(mId, Dinheiro.deCentavos(floorShare)))
  })

  // Distribuir resto de centavos ao comprador/pagador prioritariamente se ele estiver no split
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
  <div v-if="props.visible" class="fixed inset-0 bg-[#040814]/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
    <div class="glass-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-divi-border relative text-divi-t1 space-y-4 max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2 mb-1">✏️ Ajustar Lançamento</h3>
      
      <!-- Descrição -->
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Descrição</label>
        <input 
          type="text" 
          v-model="descInput" 
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1 text-sm focus:border-divi-primary" 
          placeholder="Ex: Supermercado"
        />
      </div>

      <!-- Valor Real -->
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Valor do Lançamento</label>
        <div class="flex items-center gap-2 bg-slate-950/30 border border-divi-border rounded-2xl px-4 py-2.5">
          <span class="text-divi-violet text-sm font-black">R$</span>
          <input 
            type="number" 
            step="0.01"
            v-model.number="valorInput" 
            class="w-full bg-transparent outline-none font-black text-divi-t1 text-base focus:border-0" 
            placeholder="0,00"
          />
        </div>
      </div>

      <!-- Canal de Pagamento -->
      <div v-if="!props.gasto?.isLoan" class="space-y-2">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Método / Cartão</label>
        <div class="flex gap-2">
          <button 
            @click="selectMethod('pix', null)"
            class="flex-1 py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all"
            :class="activeMethod === 'pix' ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            ⚡ Pix / Cash
          </button>
          <button 
            @click="selectMethod('card', 'luan')"
            class="flex-1 py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all"
            :class="activeMethod === 'card' && activeCardOwner === 'luan' ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            💳 Nubank (Luan)
          </button>
          <button 
            @click="selectMethod('card', 'joao')"
            class="flex-1 py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all"
            :class="activeMethod === 'card' && activeCardOwner === 'joao' ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            💳 C6 (João)
          </button>
        </div>
      </div>

      <!-- Quem pagou -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">
          {{ props.gasto?.isLoan ? 'Quem emprestou?' : activeMethod === 'pix' ? 'Quem fez o Pix?' : `Quem passou no ${getCardLabel(activeCardOwner || '')}?` }}
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="m in props.membros"
            :key="m.id"
            @click="quemPaga = m.id"
            class="py-2.5 px-1.5 text-xs font-black rounded-xl border text-center transition-all"
            :class="quemPaga === m.id ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t2'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Participantes (Split) -->
      <div v-if="!props.gasto?.isLoan" class="space-y-2">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Dividir com</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="m in props.membros"
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="relative py-3.5 px-1.5 text-xs font-black rounded-xl border text-center transition-all flex flex-col items-center gap-1.5"
            :class="selectedSplit.includes(m.id) ? 'bg-divi-primary-dim border-divi-primary text-divi-t1' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            <span class="text-xs">{{ m.nome }}</span>
            <span v-if="selectedSplit.includes(m.id)" class="absolute top-1 right-1 text-[8px] bg-divi-emerald-dim border border-emerald-500/30 text-divi-emerald font-black py-0.5 px-1.5 rounded-full">
              ✓
            </span>
          </button>
        </div>
      </div>

      <!-- Quadro Final / Prévia do Rateio -->
      <div v-if="!props.gasto?.isLoan" class="bg-divi-emerald-dim border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-md">
        <span class="text-2xl">📊</span>
        <div class="text-left leading-normal">
          <strong class="block text-divi-emerald text-[11px] font-black">Visualização do Rateio</strong>
          <span class="text-[10px] text-emerald-400 font-extrabold">{{ calculatedSharesDesc }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button @click="emit('cancel')" class="px-5 py-3.5 text-xs font-black bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border rounded-2xl transition-all flex-1">
          Voltar
        </button>
        <button 
          @click="handleConfirm" 
          class="px-5 py-3.5 text-xs font-black bg-divi-primary border border-indigo-500/25 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg transition-all flex-1" 
          :disabled="!descInput.trim() || valorInput <= 0"
        >
          Confirmar Ajuste
        </button>
      </div>
    </div>
  </div>
</template>
