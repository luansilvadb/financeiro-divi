<script setup lang="ts">
import { ref, reactive } from 'vue'
import { tenantSessionService, contaFixaRepository, cartaoRepository } from '../../shared/container'
import { Cartao } from '../../models/entities/Cartao'
import { useMembros } from '../../viewmodels/useMembros'
import { Home, Plus, Key, ArrowRight, LogOut, Check, ChevronLeft, CreditCard, Calendar, Trash2, ShieldAlert } from 'lucide-vue-next'
import IllustrationMascot from '../components/ui/IllustrationMascot.vue'
import { useAsync } from '../../composables/useAsync'

const emit = defineEmits<{
  'casa-selecionada': []
  'logout': []
}>()

type Modo = 'inicio' | 'criar' | 'entrar'
const modo = ref<Modo>('inicio')

const { loading, errorMsg, run } = useAsync()

const estado = reactive({
  casaCriada: null as null | { name: string; inviteCode: string }
})

const nomeCasa = ref('')
const codigoConvite = ref('')

const username = localStorage.getItem('divi_username') || 'você'

// Estados do Wizard
const etapaWizard = ref(1) // 1 = Nome, 2 = Contas Fixas, 3 = Cartões, 4 = Conclusão

interface ContaOnboarding {
  id: string
  name: string
  icon: string
  selecionada: boolean
  valor: string
}

const contasSugeridas = ref<ContaOnboarding[]>([
  { id: 'aluguel', name: 'Aluguel', icon: '🔑', selecionada: true, valor: '1500,00' },
  { id: 'luz', name: 'Energia (Luz)', icon: '💡', selecionada: true, valor: '' },
  { id: 'agua', name: 'Água', icon: '💧', selecionada: true, valor: '' },
  { id: 'internet', name: 'Internet / Wi-Fi', icon: '🌐', selecionada: true, valor: '120,00' },
  { id: 'pet', name: 'Cuidados Pet', icon: '🐶', selecionada: false, valor: '' },
  { id: 'limpeza', name: 'Faxina / Limpeza', icon: '🧹', selecionada: false, valor: '' }
])

const novaContaNome = ref('')
const novaContaIcon = ref('💰')
const novaContaValor = ref('')
const mostrarFormNovaConta = ref(false)

function adicionarContaCustomizada() {
  if (!novaContaNome.value.trim()) return
  contasSugeridas.value.push({
    id: `custom-${Math.random().toString(36).substring(2, 9)}`,
    name: novaContaNome.value.trim(),
    icon: novaContaIcon.value,
    selecionada: true,
    valor: novaContaValor.value
  })
  novaContaNome.value = ''
  novaContaIcon.value = '💰'
  novaContaValor.value = ''
  mostrarFormNovaConta.value = false
}

interface CartaoOnboarding {
  nome: string
  diaFechamento: number
}
const cartoesCadastro = ref<CartaoOnboarding[]>([])
const novoCartaoNome = ref('')
const novoCartaoDia = ref(10)
const mostrarFormNovoCartao = ref(false)

function adicionarCartaoLista() {
  if (!novoCartaoNome.value.trim()) return
  cartoesCadastro.value.push({
    nome: novoCartaoNome.value.trim(),
    diaFechamento: Math.min(Math.max(novoCartaoDia.value, 1), 31)
  })
  novoCartaoNome.value = ''
  novoCartaoDia.value = 10
  mostrarFormNovoCartao.value = false
}

function removerCartaoLista(index: number) {
  cartoesCadastro.value.splice(index, 1)
}

function avancarPasso() {
  if (etapaWizard.value === 1) {
    if (!nomeCasa.value.trim()) {
      errorMsg.value = 'Dê um nome para a sua casa'
      return
    }
    errorMsg.value = ''
    etapaWizard.value = 2
  } else if (etapaWizard.value === 2) {
    etapaWizard.value = 3
  }
}

async function finalizarWizard() {
  errorMsg.value = ''
  
  // 1. Criar o Tenant
  const tenant = await run(
    () => tenantSessionService.criarCasa(nomeCasa.value.trim()),
    'Não foi possível criar a casa'
  )

  if (!tenant) return

  try {
    // 2. Carregar o membro criado (usuário logado) para vincular como dono padrão dos cartões
    const membrosVM = useMembros()
    await membrosVM.carregar()
    const membroLogado = membrosVM.currentMembro.value
    const responsavelId = membroLogado ? membroLogado.id : 'membro-criador'

    // 3. Salvar as Contas Fixas selecionadas
    for (const conta of contasSugeridas.value) {
      if (conta.selecionada) {
        let valorCentavos: number | null = null
        if (conta.valor) {
          const limpo = conta.valor.replace(',', '.')
          const num = parseFloat(limpo)
          if (!isNaN(num)) {
            valorCentavos = Math.round(num * 100)
          }
        }
        await contaFixaRepository.salvar({
          id: conta.id,
          name: conta.name,
          icon: conta.icon,
          fixedValueCentavos: valorCentavos,
          defaultSplit: []
        })
      }
    }

    // 4. Salvar os Cartões de Crédito cadastrados
    for (const cartao of cartoesCadastro.value) {
      const cartaoEntity = new Cartao({
        id: `cartao-${crypto.randomUUID()}`,
        nome: cartao.nome,
        diaFechamento: cartao.diaFechamento,
        responsavelPadraoId: responsavelId
      })
      await cartaoRepository.salvar(cartaoEntity)
    }

    // Avança para a etapa de sucesso (4) e define o estado da casa criada
    estado.casaCriada = tenant
    etapaWizard.value = 4
  } catch (e) {
    console.error('Erro ao salvar parametrizações iniciais:', e)
    errorMsg.value = 'Erro ao salvar as configurações iniciais da casa.'
  }
}

async function entrarCasa() {
  if (!codigoConvite.value.trim()) {
    errorMsg.value = 'Digite o código de convite'
    return
  }

  const success = await run(
    () => tenantSessionService.entrarCasa(codigoConvite.value.trim()),
    'Código inválido ou casa não encontrada'
  )

  if (success) {
    emit('casa-selecionada')
  }
}

function irParaDashboard() {
  emit('casa-selecionada')
}

function voltar() {
  if (etapaWizard.value > 1 && etapaWizard.value < 4) {
    etapaWizard.value -= 1
    errorMsg.value = ''
  } else {
    modo.value = 'inicio'
    etapaWizard.value = 1
    errorMsg.value = ''
    estado.casaCriada = null
    nomeCasa.value = ''
    codigoConvite.value = ''
    contasSugeridas.value = [
      { id: 'aluguel', name: 'Aluguel', icon: '🔑', selecionada: true, valor: '1500,00' },
      { id: 'luz', name: 'Energia (Luz)', icon: '💡', selecionada: true, valor: '' },
      { id: 'agua', name: 'Água', icon: '💧', selecionada: true, valor: '' },
      { id: 'internet', name: 'Internet / Wi-Fi', icon: '🌐', selecionada: true, valor: '120,00' },
      { id: 'pet', name: 'Cuidados Pet', icon: '🐶', selecionada: false, valor: '' },
      { id: 'limpeza', name: 'Faxina / Limpeza', icon: '🧹', selecionada: false, valor: '' }
    ]
    cartoesCadastro.value = []
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
    <!-- Card Container -->
    <div class="w-full max-w-[440px] bg-card rounded-2xl shadow-subtle p-8 sm:p-10 transition-all duration-300">

      <div class="text-center mb-10 relative">
        <div class="inline-flex justify-center mb-5 transform hover:rotate-12 transition-transform duration-300 pointer-events-none">
          <IllustrationMascot variant="ember" :size="56" mood="happy" class="animate-wobble" />
        </div>
        <h1 class="text-display text-4xl mb-1">
          Olá, {{ username }} 👋
        </h1>
        <p class="text-body text-ash font-semibold">
          Para começar, você precisa de uma <strong class="text-charcoal font-bold uppercase tracking-tighter">casa</strong>
        </p>
      </div>

      <Transition name="slide-up" mode="out-in">
        <div v-if="modo === 'inicio'" key="inicio" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">

          <button
            @click="modo = 'criar'"
            class="group w-full bg-parchment border-none rounded-2xl p-5 text-left hover:bg-stone shadow-subtle transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus class="w-6 h-6 text-ember" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-charcoal text-base tracking-tight">Criar uma casa nova</p>
                <p class="text-xs text-graphite font-medium mt-0.5">Comece do zero e convide outras pessoas</p>
              </div>
              <ArrowRight class="w-4 h-4 text-stone group-hover:text-ember transition-colors flex-shrink-0" />
            </div>
          </button>

          <button
            @click="modo = 'entrar'"
            class="group w-full bg-parchment border-none rounded-2xl p-5 text-left hover:bg-stone shadow-subtle transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                <Key class="w-6 h-6 text-charcoal" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-charcoal text-base tracking-tight">Entrar em uma casa</p>
                <p class="text-xs text-graphite font-medium mt-0.5">Use o código de convite recebido</p>
              </div>
              <ArrowRight class="w-4 h-4 text-stone group-hover:text-charcoal transition-colors flex-shrink-0" />
            </div>
          </button>

          <div class="pt-6">
            <button
              @click="$emit('logout')"
              class="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ash hover:text-ember transition-colors py-2 bg-transparent border-none cursor-pointer"
            >
              <LogOut class="w-3.5 h-3.5" />
              Sair da conta
            </button>
          </div>
        </div>

        <div v-else-if="modo === 'criar'" key="criar">
          <Transition name="fade" mode="out-in">
            <!-- PASSO 4: Sucesso (Casa Criada) -->
            <div v-if="etapaWizard === 4 && estado.casaCriada" key="sucesso" class="text-center animate-in zoom-in-95 duration-200">
              <div class="mb-6">
                <div class="w-16 h-16 bg-meadow/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-meadow/20">
                  <Check class="w-8 h-8 text-meadow" />
                </div>
                <h2 class="text-xl font-bold text-charcoal tracking-tight">Casa pronta! 🏡</h2>
                <p class="text-xs text-graphite mt-1">
                  A moradia <strong class="text-charcoal font-bold">{{ estado.casaCriada.name }}</strong> foi configurada com sucesso.
                </p>
              </div>

              <div class="bg-parchment shadow-subtle rounded-2xl p-5 mb-6">
                <p class="text-[9px] text-graphite mb-1.5 uppercase tracking-widest font-bold">Código de convite</p>
                <p class="text-2xl font-bold text-ember tracking-[0.2em] font-mono text-center select-all">
                  {{ estado.casaCriada.inviteCode }}
                </p>
                <p class="text-[10px] text-ash mt-3 leading-relaxed font-medium">
                  Compartilhe este código com os outros moradores <br/>para que eles entrem na casa.
                </p>
              </div>

              <button
                @click="irParaDashboard"
                class="w-full bg-midnight hover:bg-charcoal text-white font-bold py-3.5 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
              >
                Ir para o Dashboard
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>

            <!-- PASSO 1: Nome da Casa -->
            <div v-else-if="etapaWizard === 1" key="passo-nome" class="animate-in fade-in slide-in-from-right-2 duration-200">
              <header class="flex items-center gap-4 mb-6">
                <button @click="voltar" class="w-9 h-9 rounded-full bg-stone hover:bg-ash/20 flex items-center justify-center text-charcoal transition-colors border-none cursor-pointer">
                  <ChevronLeft class="w-4.5 h-4.5" />
                </button>
                <div>
                  <h2 class="text-lg font-bold text-charcoal tracking-tight leading-none">Criar Nova Casa</h2>
                  <p class="text-[10px] text-graphite font-semibold mt-1">Passo 1 de 3: Identidade</p>
                </div>
              </header>

              <div class="space-y-5">
                <div class="space-y-1.5">
                  <label for="nome-casa" class="block text-[10px] font-bold text-charcoal uppercase tracking-widest ml-1">
                    Nome da Casa
                  </label>
                  <div class="relative">
                    <input
                      id="nome-casa"
                      v-model="nomeCasa"
                      type="text"
                      placeholder="Ex: República Central, Casa Luan..."
                      maxlength="60"
                      autofocus
                      @keydown.enter="avancarPasso"
                      class="w-full bg-canvas border border-stone rounded-xl px-4 py-3 text-sm font-bold text-charcoal placeholder:text-ash focus:outline-none focus:border-ember transition-all"
                    />
                    <span
                      v-if="nomeCasa.length > 0"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-ash/60"
                    >
                      {{ nomeCasa.length }}/60
                    </span>
                  </div>
                </div>

                <Transition name="fade">
                  <div v-if="errorMsg" role="alert" class="bg-coral/10 text-coral text-caption px-4 py-2.5 rounded-card flex items-center gap-2 font-semibold">
                    <span>⚠️</span>
                    <span>{{ errorMsg }}</span>
                  </div>
                </Transition>

                <button
                  @click="avancarPasso"
                  :disabled="!nomeCasa.trim()"
                  class="w-full bg-ember hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
                >
                  Continuar
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- PASSO 2: Parametrizar Contas Fixas -->
            <div v-else-if="etapaWizard === 2" key="passo-contas" class="animate-in fade-in slide-in-from-right-2 duration-200">
              <header class="flex items-center gap-4 mb-5">
                <button @click="voltarWizard" class="w-9 h-9 rounded-full bg-stone hover:bg-ash/20 flex items-center justify-center text-charcoal transition-colors border-none cursor-pointer">
                  <ChevronLeft class="w-4.5 h-4.5" />
                </button>
                <div>
                  <h2 class="text-lg font-bold text-charcoal tracking-tight leading-none">Contas da Casa</h2>
                  <p class="text-[10px] text-graphite font-semibold mt-1">Passo 2 de 3: Contas Fixas</p>
                </div>
              </header>

              <div class="space-y-4">
                <p class="text-[11px] text-graphite font-medium leading-normal">
                  Selecione as despesas fixas recorrentes da moradia. Deixe o valor em branco caso ele mude todo mês.
                </p>

                <!-- Grid de Contas -->
                <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  <div
                    v-for="conta in contasSugeridas"
                    :key="conta.id"
                    class="flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer"
                    :class="conta.selecionada ? 'bg-ember/5 border-ember/30 shadow-sm' : 'bg-parchment border-stone'"
                    @click.self="conta.selecionada = !conta.selecionada"
                  >
                    <input
                      type="checkbox"
                      v-model="conta.selecionada"
                      class="w-4 h-4 text-ember accent-ember cursor-pointer"
                    />
                    <span class="text-lg select-none">{{ conta.icon }}</span>
                    <span class="flex-1 text-xs font-bold text-charcoal select-none" @click="conta.selecionada = !conta.selecionada">
                      {{ conta.name }}
                    </span>
                    <div v-if="conta.selecionada" class="w-24 flex items-center bg-canvas border border-stone rounded-lg px-2 py-1">
                      <span class="text-[9px] text-ash font-bold mr-1 select-none">R$</span>
                      <input
                        type="text"
                        v-model="conta.valor"
                        placeholder="Variável"
                        class="w-full bg-transparent border-none text-[10px] font-bold text-charcoal focus:outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                <!-- Formulário de Conta Customizada -->
                <div class="bg-parchment rounded-2xl border border-stone p-3.5 space-y-2.5">
                  <button
                    v-if="!mostrarFormNovaConta"
                    @click="mostrarFormNovaConta = true"
                    class="w-full py-2 bg-white hover:bg-stone text-[10px] font-bold uppercase tracking-wider text-graphite rounded-xl border border-stone transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus class="w-3.5 h-3.5" /> Adicionar Outra Despesa
                  </button>

                  <div v-else class="space-y-2">
                    <div class="flex gap-2">
                      <input
                        type="text"
                        v-model="novaContaIcon"
                        placeholder="Emoji"
                        class="w-12 bg-canvas border border-stone rounded-xl text-center py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="text"
                        v-model="novaContaNome"
                        placeholder="Nome (Ex: Netflix, Faxina...)"
                        class="flex-1 bg-canvas border border-stone rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:outline-none"
                      />
                    </div>
                    <div class="flex gap-2">
                      <div class="flex-1 flex items-center bg-canvas border border-stone rounded-xl px-3 py-2">
                        <span class="text-[10px] text-ash font-bold mr-1">R$</span>
                        <input
                          type="text"
                          v-model="novaContaValor"
                          placeholder="Valor Estimado"
                          class="w-full bg-transparent border-none text-xs font-bold text-charcoal focus:outline-none"
                        />
                      </div>
                      <button
                        @click="adicionarContaCustomizada"
                        :disabled="!novaContaNome.trim()"
                        class="bg-midnight hover:bg-charcoal text-white text-xs font-bold px-4 rounded-xl border-none cursor-pointer disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  @click="avancarPasso"
                  class="w-full bg-ember hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
                >
                  Continuar
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- PASSO 3: Cartões de Crédito -->
            <div v-else-if="etapaWizard === 3" key="passo-cartoes" class="animate-in fade-in slide-in-from-right-2 duration-200">
              <header class="flex items-center gap-4 mb-5">
                <button @click="voltarWizard" class="w-9 h-9 rounded-full bg-stone hover:bg-ash/20 flex items-center justify-center text-charcoal transition-colors border-none cursor-pointer">
                  <ChevronLeft class="w-4.5 h-4.5" />
                </button>
                <div>
                  <h2 class="text-lg font-bold text-charcoal tracking-tight leading-none">Cartões de Crédito</h2>
                  <p class="text-[10px] text-graphite font-semibold mt-1">Passo 3 de 3: Cartões</p>
                </div>
              </header>

              <div class="space-y-4">
                <p class="text-[11px] text-graphite font-medium leading-normal">
                  Cadastre os cartões coletivos que a casa usa para compras. Eles ficarão em seu nome para segurança, mas todos poderão lançar neles.
                </p>

                <!-- Lista de Cartões Cadastrados -->
                <div class="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  <div
                    v-for="(cartao, index) in cartoesCadastro"
                    :key="index"
                    class="flex items-center justify-between p-3 bg-parchment rounded-2xl border border-stone shadow-sm"
                  >
                    <div class="flex items-center gap-2.5">
                      <CreditCard class="w-4 h-4 text-ember" />
                      <div>
                        <p class="text-xs font-bold text-charcoal leading-none">{{ cartao.nome }}</p>
                        <p class="text-[9px] text-graphite font-semibold mt-1">Fechamento: Todo dia {{ cartao.diaFechamento }}</p>
                      </div>
                    </div>
                    <button
                      @click="removerCartaoLista(index)"
                      class="p-1.5 hover:text-coral text-ash hover:bg-stone/50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div v-if="cartoesCadastro.length === 0" class="text-center py-4 bg-canvas border border-dashed border-stone rounded-2xl">
                    <CreditCard class="w-6 h-6 text-ash/40 mx-auto mb-1" />
                    <p class="text-[10px] text-ash font-bold">Nenhum cartão cadastrado</p>
                  </div>
                </div>

                <!-- Formulário Novo Cartão -->
                <div class="bg-parchment rounded-2xl border border-stone p-3.5 space-y-2.5">
                  <button
                    v-if="!mostrarFormNovoCartao"
                    @click="mostrarFormNovoCartao = true"
                    class="w-full py-2 bg-white hover:bg-stone text-[10px] font-bold uppercase tracking-wider text-graphite rounded-xl border border-stone transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus class="w-3.5 h-3.5" /> Adicionar Cartão
                  </button>

                  <div v-else class="space-y-2.5 animate-in fade-in duration-200">
                    <div class="space-y-1">
                      <label class="block text-[9px] font-bold text-graphite uppercase tracking-widest ml-1">Nome do Cartão</label>
                      <input
                        type="text"
                        v-model="novoCartaoNome"
                        placeholder="Ex: Nubank Casa, Visa Luan..."
                        class="w-full bg-canvas border border-stone rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:outline-none"
                      />
                    </div>
                    <div class="flex gap-2.5 items-end">
                      <div class="flex-1 space-y-1">
                        <label class="block text-[9px] font-bold text-graphite uppercase tracking-widest ml-1">Dia do Fechamento</label>
                        <input
                          type="number"
                          v-model="novoCartaoDia"
                          min="1"
                          max="31"
                          class="w-full bg-canvas border border-stone rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:outline-none text-center"
                        />
                      </div>
                      <div class="flex gap-1.5">
                        <button
                          @click="mostrarFormNovoCartao = false"
                          class="bg-stone text-charcoal text-xs font-bold py-2.5 px-3 rounded-xl border-none cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          @click="adicionarCartaoLista"
                          :disabled="!novoCartaoNome.trim() || !novoCartaoDia"
                          class="bg-midnight hover:bg-charcoal text-white text-xs font-bold py-2.5 px-4 rounded-xl border-none cursor-pointer disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <Transition name="fade">
                  <div v-if="errorMsg" role="alert" class="bg-coral/10 text-coral text-caption px-4 py-2.5 rounded-card flex items-center gap-2 font-semibold">
                    <span>⚠️</span>
                    <span>{{ errorMsg }}</span>
                  </div>
                </Transition>

                <button
                  @click="finalizarWizard"
                  :disabled="loading"
                  class="w-full bg-midnight hover:bg-charcoal text-white font-bold py-3.5 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
                >
                  <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                  <Check class="w-4 h-4" v-else />
                  Finalizar e Criar Casa
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <div v-else-if="modo === 'entrar'" key="entrar" class="animate-in fade-in slide-in-from-right-2 duration-200 space-y-5">
          <div class="flex items-center gap-4 mb-8">
            <button @click="voltar" class="w-10 h-10 rounded-full bg-stone hover:bg-ash/20 flex items-center justify-center text-charcoal transition-colors border-none cursor-pointer">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <div>
              <h2 class="text-xl font-bold text-charcoal tracking-tight leading-none">Entrar em Casa</h2>
              <p class="text-xs text-graphite font-semibold mt-1">Insira o código de convite</p>
            </div>
          </div>

          <div class="space-y-2">
            <label for="codigo-convite" class="block text-[10px] font-bold text-charcoal uppercase tracking-widest ml-1">
              Código de Convite
            </label>
            <input
              id="codigo-convite"
              v-model="codigoConvite"
              type="text"
              placeholder="Ex: CASA-AB12C"
              autofocus
              @keydown.enter="entrarCasa"
              class="w-full bg-canvas border border-stone rounded-xl px-4 py-3.5 text-lg font-bold text-charcoal placeholder:text-ash focus:outline-none focus:border-midnight font-mono uppercase tracking-[0.2em] transition-all duration-200 text-center"
            />
          </div>

          <Transition name="fade">
            <div v-if="errorMsg" role="alert" class="bg-coral/10 text-coral text-caption px-4 py-3 rounded-card flex items-center gap-2 font-semibold">
              <span>⚠️</span>
              <span>{{ errorMsg }}</span>
            </div>
          </Transition>

          <button
            @click="entrarCasa"
            :disabled="loading || !codigoConvite.trim()"
            class="w-full bg-midnight hover:bg-charcoal disabled:opacity-50 text-white font-bold py-4 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
          >
            <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
            <Key class="w-4 h-4" v-else />
            Entrar na Casa
          </button>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.18s ease-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
