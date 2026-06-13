<script setup lang="ts">
import { computed } from 'vue'
import MembroAvatar from '../ui/MembroAvatar.vue'
import { Check } from 'lucide-vue-next'
import { obterMembrosSelecionadosSemRenda } from '../../../shared/utils/rateio'
import { formatarBRL } from '../../../shared/utils/formatarMoeda'

interface Member {
  id: string
  nome: string
  rendaCentavos?: number
}

interface Props {
  membros: Member[]
  participantesDivisao: string[]
  compradorSelecionadoId: string
  splitType: 'equal' | 'proportional'
  valorTotal?: number
}

const props = defineProps<Props>()
const emit = defineEmits(['update:participantesDivisao', 'update:splitType'])

const internalParticipantes = computed({
  get: () => props.participantesDivisao,
  set: (val) => emit('update:participantesDivisao', val)
})

const toggleSplitMember = (id: string) => {
  const current = [...internalParticipantes.value]
  const idx = current.indexOf(id)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(id)
  internalParticipantes.value = current
}

const selecionarTodos = () => {
  internalParticipantes.value = props.membros.map(m => m.id)
}

const selecionarApenasEu = () => {
  internalParticipantes.value = [props.compradorSelecionadoId]
}

const membrosSelecionadosSemRenda = computed(() =>
  obterMembrosSelecionadosSemRenda(props.membros, props.participantesDivisao)
)

const proporcionalDisponivel = computed(() =>
  props.participantesDivisao.length > 0 && membrosSelecionadosSemRenda.value.length === 0
)

const proporcoesMembros = computed(() => {
  if (props.splitType !== 'proportional' || !proporcionalDisponivel.value) {
    return {}
  }
  
  const participantesComRenda = props.participantesDivisao.map(id => {
    const m = props.membros.find(memb => memb.id === id)
    const renda = m?.rendaCentavos && Number(m.rendaCentavos) > 0 ? Number(m.rendaCentavos) : 0
    return { id, renda }
  })

  const somaRendasTotal = participantesComRenda.reduce((acc, p) => acc + p.renda, 0)
  const resultado: { [id: string]: { percent: number; valor?: number } } = {}

  participantesComRenda.forEach(p => {
    const percent = (p.renda / somaRendasTotal) * 100
    let valorEstimado: number | undefined = undefined
    if (props.valorTotal) {
      valorEstimado = props.valorTotal * (p.renda / somaRendasTotal)
    }

    resultado[p.id] = {
      percent,
      valor: valorEstimado
    }
  })

  return resultado
})
</script>

<template>
  <div class="space-y-4 animate-in fade-in duration-300">
    <!-- Seletor do Tipo de Rateio -->
    <div class="flex justify-between items-center p-3.5 bg-stone/20 rounded-2xl border border-stone/60">
      <span class="text-xs font-bold text-charcoal">Divisão das Contas</span>
      <div class="inline-flex p-1 bg-stone/40 rounded-xl relative whitespace-nowrap">
        <button
          type="button"
          @click="emit('update:splitType', 'equal')"
          class="px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer border-none transition-all duration-200"
          :class="[splitType === 'equal' ? 'bg-white text-charcoal shadow-sm' : 'bg-transparent text-ash hover:text-charcoal']"
        >
          Igual
        </button>
        <button
          type="button"
          @click="emit('update:splitType', 'proportional')"
          class="px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer border-none transition-all duration-200"
          :class="[splitType === 'proportional' ? 'bg-white text-charcoal shadow-sm' : 'bg-transparent text-ash hover:text-charcoal']"
        >
          Proporcional
        </button>
      </div>
    </div>

    <div
      v-if="splitType === 'proportional' && !proporcionalDisponivel"
      role="alert"
      class="p-3.5 rounded-2xl border border-sunburst/30 bg-sunburst/10 text-[11px] text-charcoal font-semibold leading-relaxed"
    >
      Informe uma renda positiva para
      <strong>{{ membrosSelecionadosSemRenda.map(membro => membro.nome).join(', ') }}</strong>
      ou escolha a divisão igual para continuar.
    </div>

    <div class="flex gap-2" role="group" aria-label="Atalhos de divisão">
      <button 
        @click="selecionarTodos" 
        class="px-3.5 py-2 rounded-full bg-midnight text-white text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-charcoal transition-colors"
      >
        Todos
      </button>
      <button 
        @click="selecionarApenasEu" 
        class="px-3.5 py-2 rounded-full bg-stone text-charcoal text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-ash/20 transition-colors"
      >
        Apenas eu
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2" role="listbox" aria-multiselectable="true" aria-label="Selecionar membros para dividir">
      <button
        v-for="m in membros"
        :key="m.id"
        @click="toggleSplitMember(m.id)"
        role="option"
        :aria-selected="internalParticipantes.includes(m.id)"
        class="group relative flex flex-col items-center gap-2 p-3 rounded-card transition-all duration-300 border-none cursor-pointer"
        :class="[internalParticipantes.includes(m.id) ? 'bg-white shadow-subtle scale-[1.02]' : 'bg-parchment opacity-80']"
      >
        <MembroAvatar 
          :nome="m.nome" 
          size="md" 
          :variant="internalParticipantes.includes(m.id) ? 'meadow' : 'sky'" 
        />
        <span class="text-[10px] font-bold text-charcoal uppercase tracking-tight truncate max-w-full px-1">{{ m.nome }}</span>
        <span 
          v-if="splitType === 'proportional' && internalParticipantes.includes(m.id) && proporcoesMembros[m.id]"
          class="text-[9px] font-bold text-ash mt-0.5 leading-none block text-center animate-in fade-in duration-300"
        >
          {{ Math.round(proporcoesMembros[m.id]?.percent ?? 0) }}%
          <span v-if="proporcoesMembros[m.id]?.valor !== undefined" class="block text-[8px] text-slate-500 font-semibold mt-0.5">
            {{ formatarBRL(proporcoesMembros[m.id]?.valor ?? 0) }}
          </span>
        </span>
        <Check v-if="internalParticipantes.includes(m.id)" class="absolute top-2 right-2 w-3.5 h-3.5 text-meadow animate-in zoom-in-50 duration-300" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
