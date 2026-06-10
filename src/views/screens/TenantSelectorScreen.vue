<script setup lang="ts">
import { ref, reactive } from 'vue'
import { tenantSessionService } from '../../shared/container'
import { Home, Plus, Key, ArrowRight, LogOut, Check, ChevronLeft } from 'lucide-vue-next'
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

async function criarCasa() {
  if (!nomeCasa.value.trim()) {
    errorMsg.value = 'Dê um nome para a sua casa'
    return
  }

  const tenant = await run(
    () => tenantSessionService.criarCasa(nomeCasa.value.trim()),
    'Não foi possível criar a casa'
  )

  if (tenant) {
    estado.casaCriada = tenant
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
  modo.value = 'inicio'
  errorMsg.value = ''
  estado.casaCriada = null
  nomeCasa.value = ''
  codigoConvite.value = ''
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
            <div v-if="estado.casaCriada" key="sucesso" class="text-center animate-in zoom-in-95 duration-200">
              <div class="mb-8">
                <div class="w-20 h-20 bg-meadow/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-meadow/20">
                  <Check class="w-10 h-10 text-meadow" />
                </div>
                <h2 class="text-2xl font-bold text-charcoal tracking-tight">Casa criada! 🏡</h2>
                <p class="text-body text-graphite mt-1">
                  <strong class="text-charcoal font-bold">{{ estado.casaCriada.name }}</strong> está pronta.
                </p>
              </div>

              <div class="bg-parchment shadow-subtle rounded-2xl p-6 mb-8">
                <p class="text-[10px] text-graphite mb-2 uppercase tracking-widest font-bold">Código de convite</p>
                <p class="text-3xl font-bold text-ember tracking-[0.2em] font-mono">
                  {{ estado.casaCriada.inviteCode }}
                </p>
                <p class="text-[10px] text-ash mt-4 leading-relaxed font-medium">Compartilhe este código com as pessoas <br/>que vão morar com você.</p>
              </div>

              <button
                @click="irParaDashboard"
                class="w-full bg-midnight hover:bg-charcoal text-white font-bold py-4 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
              >
                Ir para o Dashboard
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>

            <div v-else key="form-criar" class="animate-in fade-in slide-in-from-right-2 duration-200">
              <header class="flex items-center gap-4 mb-8">
                <button @click="voltar" class="w-10 h-10 rounded-full bg-stone hover:bg-ash/20 flex items-center justify-center text-charcoal transition-colors border-none cursor-pointer">
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <div>
                  <h2 class="text-xl font-bold text-charcoal tracking-tight leading-none">Nova Casa</h2>
                  <p class="text-xs text-graphite font-semibold mt-1">Dê um nome para a sua casa</p>
                </div>
              </header>

              <div class="space-y-6">
                <div class="space-y-2">
                  <label for="nome-casa" class="block text-[10px] font-bold text-charcoal uppercase tracking-widest ml-1">
                    Nome da Casa
                  </label>
                  <div class="relative">
                    <input
                      id="nome-casa"
                      v-model="nomeCasa"
                      type="text"
                      placeholder="Ex: Casa da Família Silva"
                      maxlength="60"
                      autofocus
                      @keydown.enter="criarCasa"
                      class="w-full bg-canvas border border-stone rounded-xl px-4 py-3.5 pr-14 text-body text-charcoal placeholder:text-ash focus:outline-none focus:border-ember transition-all duration-200"
                    />
                    <span
                      v-if="nomeCasa.length > 0"
                      aria-live="polite"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ash/60 animate-in fade-in zoom-in-95 duration-300"
                    >
                      {{ nomeCasa.length }}/60
                    </span>
                  </div>
                </div>

                <Transition name="fade">
                  <div v-if="errorMsg" role="alert" class="bg-coral/10 text-coral text-caption px-4 py-3 rounded-card flex items-center gap-2 font-semibold">
                    <span>⚠️</span>
                    <span>{{ errorMsg }}</span>
                  </div>
                </Transition>

                <button
                  @click="criarCasa"
                  :disabled="loading || !nomeCasa.trim()"
                  class="w-full bg-ember hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-pill text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95"
                >
                  <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                  <Home class="w-4 h-4" v-else />
                  Criar Casa
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
