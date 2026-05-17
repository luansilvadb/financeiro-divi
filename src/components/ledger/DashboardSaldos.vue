<script setup lang="ts">
import { ref } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import RevisaoFatura from './dashboard/RevisaoFatura.vue'
import HistoricoFaturas from './dashboard/HistoricoFaturas.vue'
import ModalFecharFatura from './dashboard/ModalFecharFatura.vue'

interface Props {
  membros: { id: string; nome: string }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  calcularAdiantamento?: (faturaId: string, membroId: string) => number
  gastos?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits(['quitarAcerto', 'fecharFatura', 'novoGasto', 'reabrirFatura'])

const {
  confirmarAcertosManual,
  registrarReembolsoParcialManual,
  registrarPagamentoBancoManual,
  removerPagamentoBancoManual,
  atualizarGastoDivisoesManual,
  fecharFaturaManual,
  gastos: globalGastos,
  acertos: globalAcertos
} = useCartoesEFaturas()

// Estado de revisão imersiva (Gap 2)
const faturaSobRevisao = ref<any | null>(null)

// Estado do modal de fechamento (Gap 6)
const showModalFechar = ref(false)
const faturaParaFechar = ref<any | null>(null)

const abrirFecharFatura = (faturaId: string) => {
  const fatura = props.faturasAbertas.find(f => f.id === faturaId)
  if (fatura) {
    faturaParaFechar.value = fatura
    showModalFechar.value = true
  }
}

const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
  await fecharFaturaManual(faturaId, responsavelId)
  showModalFechar.value = false
  faturaParaFechar.value = null
}

// Estado interativo do editor de divisão por gasto
const gastoExpandidoId = ref<string | null>(null)
const modoDivisao = ref<'IGUAL' | 'CUSTOMIZADO' | 'PORCENTAGEM'>('IGUAL')
const valoresDivisao = ref<Record<string, number>>({}) // membroId -> valor (R$ ou %)

// Estado de Pix Parcial por acerto
const acertoPixId = ref<string | null>(null)
const valorPixInput = ref<number>(0)

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const getCartaoNome = (cartaoId: string) => {
  return props.cartoes.find(c => c.id === cartaoId)?.nome || 'Cartão'
}

const formatarDinheiro = (centavos: number) => {
  return Dinheiro.deCentavos(centavos).centavos / 100
}

const getConsumo = (faturaId: string, membroId: string) => {
  return props.calcularConsumo(faturaId, membroId)
}

const getAdiantamento = (faturaId: string, membroId: string) => {
  return props.calcularAdiantamento ? props.calcularAdiantamento(faturaId, membroId) : 0
}

const calcularTotalFatura = (faturaId: string) => {
  return props.membros.reduce((sum, m) => sum + getConsumo(faturaId, m.id), 0)
}

// Filtra acertos pertencentes a uma fatura fechada específica
const acertosDaFatura = (faturaId: string) => {
  const list = props.acertosPendentes && props.acertosPendentes.length > 0
    ? props.acertosPendentes
    : globalAcertos.value
  return list.filter(a => a.faturaId === faturaId)
}

// Verifica se a fatura fechada já possui acertos gerados (está no estado de acerto ativo)
const faturaTemAcertosAtivos = (faturaId: string) => {
  return acertosDaFatura(faturaId).length > 0
}

// Gastos associados à fatura
const gastosDaFatura = (faturaId: string) => {
  const list = props.gastos && props.gastos.length > 0
    ? props.gastos
    : globalGastos.value
  return list.filter((g: Gasto) => g.faturaId === faturaId)
}

// Inicia o painel de divisão interativo
const iniciarEdicaoDivisao = (gasto: any) => {
  gastoExpandidoId.value = gasto.id
  modoDivisao.value = 'IGUAL'
  
  // Preenche valores padrão iniciais com base nas divisões atuais do gasto
  const record: Record<string, number> = {}
  props.membros.forEach(m => {
    const div = gasto.divisoes.find((d: any) => d.membroId === m.id)
    record[m.id] = div ? formatarDinheiro(div.valor.centavos) : 0
  })
  valoresDivisao.value = record
}

// Muda o comprador de um gasto na revisão
const alterarCompradorGasto = async (gasto: any, novoCompradorId: string) => {
  // Mantém as divisões mas atualiza comprador
  const divisoesAtuais = gasto.divisoes.map((d: any) => new DivisaoDeGasto(d.membroId, d.valor))
  
  // Como mudamos o comprador, atualizamos no banco
  const idx = globalGastos.value.findIndex(g => g.id === gasto.id)
  if (idx >= 0) {
    const original = globalGastos.value[idx]
    const novoGasto = new (gasto.constructor || Gasto)({
      id: original.id,
      faturaId: original.faturaId,
      descricao: original.descricao,
      valorTotal: original.valorTotal,
      compradorId: novoCompradorId,
      divisoes: divisoesAtuais
    })
    await gastoRepoSalvar(novoGasto)
  }
}

// Salva o gasto no repositório auxiliar
const gastoRepoSalvar = async (novoGasto: any) => {
  const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
  await new LocalStorageGastoRepository().salvar(novoGasto)
  // Força atualização reativa
  await useCartoesEFaturas().inicializar()
}

// Salva a divisão interativa configurada
const salvarDivisaoCustomizada = async (gasto: any) => {
  const totalGastoCentavos = gasto.valorTotal.centavos
  let divisoesNovas: DivisaoDeGasto[] = []

  if (modoDivisao.value === 'IGUAL') {
    const partes = gasto.valorTotal.distribuir(props.membros.length)
    divisoesNovas = props.membros.map((m, idx) => new DivisaoDeGasto(m.id, partes[idx]))
  } else if (modoDivisao.value === 'CUSTOMIZADO') {
    divisoesNovas = props.membros.map(m => new DivisaoDeGasto(m.id, Dinheiro.deReais(valoresDivisao.value[m.id] || 0)))
  } else if (modoDivisao.value === 'PORCENTAGEM') {
    // Calcula os valores em centavos proporcionalmente
    let somaCentavosDistribuida = 0
    const divisoesPre: { membroId: string; centavos: number }[] = []
    
    props.membros.forEach(m => {
      const pct = valoresDivisao.value[m.id] || 0
      const centavos = Math.round((pct / 100) * totalGastoCentavos)
      somaCentavosDistribuida += centavos
      divisoesPre.push({ membroId: m.id, centavos })
    })

    // Corrige eventual arredondamento no último membro com saldo ativo
    const diff = totalGastoCentavos - somaCentavosDistribuida
    if (diff !== 0 && divisoesPre.length > 0) {
      divisoesPre[divisoesPre.length - 1].centavos += diff
    }

    divisoesNovas = divisoesPre.map(d => new DivisaoDeGasto(d.membroId, Dinheiro.deCentavos(d.centavos)))
  }

  await atualizarGastoDivisoesManual(gasto.id, divisoesNovas)
  gastoExpandidoId.value = null
}

// Validação em tempo real do editor de divisão
const somaDivisaoIncorreta = (gasto: any) => {
  if (modoDivisao.value === 'IGUAL') return false
  if (modoDivisao.value === 'CUSTOMIZADO') {
    const soma = props.membros.reduce((acc, m) => acc + (valoresDivisao.value[m.id] || 0), 0)
    return Math.abs(soma - formatarDinheiro(gasto.valorTotal.centavos)) > 0.01
  }
  if (modoDivisao.value === 'PORCENTAGEM') {
    const soma = props.membros.reduce((acc, m) => acc + (valoresDivisao.value[m.id] || 0), 0)
    return Math.abs(soma - 100) > 0.01
  }
  return false
}

// Inicia Pix
const iniciarPix = (acerto: any) => {
  acertoPixId.value = acerto.id
  valorPixInput.value = formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0))
}

// Envia reembolso Pix parcial/total
const enviarReembolsoPix = async (acertoId: string) => {
  if (valorPixInput.value <= 0) return
  await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(valorPixInput.value))
  acertoPixId.value = null
}
const todosOsAcertosQuitados = (faturaId: string) => {
  const acertos = acertosDaFatura(faturaId)
  return acertos.length > 0 && acertos.every(a => a.pago)
}
</script>

<template>
  <!-- Modo de Revisão Imersiva (Gap 2) -->
  <RevisaoFatura 
    v-if="faturaSobRevisao"
    :fatura="faturaSobRevisao"
    :membros="props.membros"
    @voltar="faturaSobRevisao = null"
    @acertoConfirmado="faturaSobRevisao = null"
  />

  <div v-else class="max-w-md mx-auto space-y-6">
    <!-- Seção 1: Faturas Fechadas (Fluxos de Revisão ou Acertos Ativos) -->
    <div v-for="fatura in faturasFechadas" :key="fatura.id" class="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl text-white overflow-hidden relative">
      <!-- Glow Decorativo superior -->
      <div class="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
      
      <!-- Cabeçalho da Fatura -->
      <div class="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
        <div>
          <span class="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-1">
            {{ faturaTemAcertosAtivos(fatura.id) ? '⚠️ Faturas Fechadas (Acertos Ativos)' : '🔍 Faturas Fechadas (Em Revisão)' }}
          </span>
          <span class="font-extrabold text-lg flex items-center gap-2">
            💳 Nubank <span class="text-slate-500 text-xs font-normal">• {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
          </span>
          <span class="text-[10px] text-slate-400 block mt-1">
            Responsável: <strong class="text-slate-200">{{ getMembroNome(fatura.responsavelId) }}</strong>
          </span>
        </div>
        <button 
          @click="emit('reabrirFatura', fatura.id)"
          class="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all border border-slate-700/50 flex items-center gap-1 shadow-sm"
        >
          ↩️ Reabrir
        </button>
      </div>

      <!-- SUB-ESTADO A: EM REVISÃO (Sem acertos gerados ainda) (Gap 2) -->
      <div v-if="!faturaTemAcertosAtivos(fatura.id)" class="space-y-4">
        <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-xs text-indigo-200 leading-relaxed text-center">
          🛒 <strong>Fatura Fechada sob Revisão Coletiva</strong><br>
          <span class="text-slate-400 block mt-2 text-[10px]">Total Acumulado: R$ {{ formatarDinheiro(calcularTotalFatura(fatura.id)).toFixed(2).replace('.', ',') }}</span>
        </div>

        <button 
          @click="faturaSobRevisao = fatura"
          class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 mt-2 transition-all text-center text-sm flex items-center justify-center gap-2"
        >
          🔍 Revisar Fatura e Ratear
        </button>
      </div>

      <!-- SUB-ESTADO B: ACERTOS ATIVOS (Com amortizações parciais de Pix) -->
      <div v-else class="space-y-4">
        <!-- Banner de Status de Pagamento ao Banco (Abordagem A/B) -->
        <div v-if="fatura.dataPagamentoBanco" class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center mb-2">
          <div class="text-xs text-emerald-200 leading-relaxed">
            🏦 <strong>Fatura paga ao banco!</strong> O responsável já pagou a fatura do cartão. Envie seu Pix de reembolso a ele.
          </div>
          <button 
            @click="removerPagamentoBancoManual(fatura.id)"
            class="text-[9px] font-black text-rose-400 hover:text-rose-300 underline ml-2 whitespace-nowrap"
          >
            Estornar
          </button>
        </div>

        <div v-else class="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3 mb-2">
          <div class="text-xs text-amber-200 leading-relaxed">
            ⏳ <strong>Aguardando Pagamento ao Banco:</strong> O responsável ainda não pagou a fatura ao banco.
          </div>
          <button 
            @click="registrarPagamentoBancoManual(fatura.id)"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] py-2 rounded-xl transition-all shadow-md shadow-amber-600/10"
          >
            🏦 Já paguei o banco! (Marcar como Paga ao Banco)
          </button>
        </div>

        <h4 class="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">💸 Saldos de Reembolso Pendentes</h4>

        <div v-for="acerto in acertosDaFatura(fatura.id)" :key="acerto.id" class="bg-slate-800/40 rounded-2xl border border-slate-800 p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div>
              <span class="font-extrabold text-sm block text-slate-200">
                {{ getMembroNome(acerto.membroId) }} deve para {{ getMembroNome(fatura.responsavelId) }}
              </span>
              <span class="text-[10px] text-slate-400 mt-1 block">
                Total Acerto: R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2).replace('.', ',') }}
              </span>
            </div>
            <div class="text-right">
              <span :class="['font-black text-sm block', acerto.pago ? 'text-emerald-400' : 'text-rose-400']">
                {{ acerto.pago ? '✅ Quitado' : 'R$ ' + formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0)).toFixed(2).replace('.', ',') + ' Restante' }}
              </span>
              <button 
                v-if="!acerto.pago"
                @click="iniciarPix(acerto)"
                class="text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline mt-1"
              >
                Registrar Pix
              </button>
            </div>
          </div>

          <!-- Barra de Progresso do Reembolso -->
          <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              class="bg-indigo-500 h-full rounded-full transition-all duration-300"
              :style="{ width: `${((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100}%` }"
            ></div>
          </div>

          <!-- Amortização Pix Parcial expandido -->
          <div v-if="acertoPixId === acerto.id" class="bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 mt-2 space-y-3">
            <span class="text-xs font-black uppercase text-indigo-400 block mb-2">Registrar Pagamento Pix</span>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 text-xs font-bold">R$</span>
              <input 
                v-model.number="valorPixInput"
                type="number"
                step="0.01"
                class="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 font-black text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
              <button 
                @click="enviarReembolsoPix(acerto.id)"
                class="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>

        <!-- Botão especial de encerramento de arrecadação (Abordagem B) -->
        <div v-if="todosOsAcertosQuitados(fatura.id) && !fatura.dataPagamentoBanco" class="bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-2 mt-4 border border-emerald-500/20 shadow-lg">
          <span class="text-xs font-black uppercase tracking-wider">🎉 Reembolsos Coletados!</span>
          <span class="text-[11px] text-emerald-100">Todos os moradores já enviaram os reembolsos por Pix.</span>
          <button 
            @click="registrarPagamentoBancoManual(fatura.id)"
            class="bg-white text-emerald-800 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50 shadow-md transition-colors w-full mt-1"
          >
            🏦 Registrar Pagamento ao Banco e Quitar Fatura
          </button>
        </div>
      </div>
    </div>

    <!-- Seção 2: Faturas Abertas (Previsão de Gastos) -->
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
      <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">🔍 Faturas Abertas (Previsão de Gastos)</h3>
      
      <div v-for="fatura in faturasAbertas" :key="fatura.id" class="border-b border-slate-100 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
        <div class="flex justify-between items-center mb-5">
          <div class="flex flex-col">
            <span class="font-extrabold text-slate-800 text-base">💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
            <span class="text-xs text-slate-500 font-bold mt-0.5">Total Fatura: R$ {{ formatarDinheiro(calcularTotalFatura(fatura.id)).toFixed(2).replace('.', ',') }}</span>
          </div>
          <button @click="abrirFecharFatura(fatura.id)" class="text-xs font-black bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-colors">Fechar Fatura</button>
        </div>

        <div class="space-y-3">
          <div v-for="membro in membros" :key="membro.id" class="flex flex-col border-b border-slate-50 pb-2.5 mb-2.5 last:border-0 last:pb-0 last:mb-0">
            <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-slate-700">
                {{ membro.nome }} 
                <span v-if="membro.id === fatura.responsavelId" class="text-[9px] text-indigo-600 font-black uppercase ml-1 bg-indigo-50 px-1.5 py-0.5 rounded-md">Dono</span>:
              </span>
              <span class="font-extrabold text-slate-800">
                Pendente: R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id) - getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
            <div class="flex justify-between items-center text-[11px] text-slate-400 mt-1 pl-2">
              <span>Consumo: R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}</span>
              <span v-if="getAdiantamento(fatura.id, membro.id) > 0" class="text-emerald-600 font-bold">
                Adiantado: - R$ {{ formatarDinheiro(getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Histórico de Faturas Acertadas (Gap 5) -->
    <div class="mt-8">
      <HistoricoFaturas :membros="props.membros" />
    </div>

    <!-- Modal de Fechamento de Fatura com Dono Variável (Gap 6) -->
    <ModalFecharFatura 
      :show="showModalFechar"
      :fatura="faturaParaFechar"
      :membros="props.membros"
      @close="showModalFechar = false"
      @confirmar="confirmarFechamentoFatura"
    />
  </div>
</template>
