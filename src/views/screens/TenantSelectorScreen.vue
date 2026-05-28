<script setup lang="ts">
import { ref, reactive } from 'vue'
import { tenantSessionService } from '../../shared/container'
import { Home, Plus, Key, ArrowRight, LogOut, Check } from 'lucide-vue-next'

const emit = defineEmits<{
  'casa-selecionada': []
  'logout': []
}>()

type Modo = 'inicio' | 'criar' | 'entrar'
const modo = ref<Modo>('inicio')

const estado = reactive({
  loading: false,
  erro: '',
  casaCriada: null as null | { name: string; inviteCode: string }
})

const nomeCasa = ref('')
const codigoConvite = ref('')

const username = localStorage.getItem('divi_username') || 'você'

async function criarCasa() {
  if (!nomeCasa.value.trim()) {
    estado.erro = 'Dê um nome para a sua casa'
    return
  }
  estado.loading = true
  estado.erro = ''
  try {
    const tenant = await tenantSessionService.criarCasa(nomeCasa.value.trim())
    estado.casaCriada = tenant
  } catch (err: any) {
    estado.erro = err.message || 'Não foi possível criar a casa'
  } finally {
    estado.loading = false
  }
}

async function entrarCasa() {
  if (!codigoConvite.value.trim()) {
    estado.erro = 'Digite o código de convite'
    return
  }
  estado.loading = true
  estado.erro = ''
  try {
    await tenantSessionService.entrarCasa(codigoConvite.value.trim())
    emit('casa-selecionada')
  } catch (err: any) {
    estado.erro = err.message || 'Código inválido ou casa não encontrada'
  } finally {
    estado.loading = false
  }
}

function irParaDashboard() {
  emit('casa-selecionada')
}

function voltar() {
  modo.value = 'inicio'
  estado.erro = ''
  estado.casaCriada = null
  nomeCasa.value = ''
  codigoConvite.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-[#fbfaf9] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-[440px]">

      <!-- Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ff3e00] text-white font-bold text-3xl mb-5 shadow-lg">
          ÷
        </div>
        <h1 class="text-2xl font-semibold tracking-tight text-[#343433] mb-1">
          Olá, {{ username }} 👋
        </h1>
        <p class="text-sm text-[#848281]">
          Para começar, você precisa de uma <strong class="text-[#474645]">casa</strong>
        </p>
      </div>

      <!-- Tela: Início -->
      <Transition name="slide-up" mode="out-in">
        <div v-if="modo === 'inicio'" key="inicio" class="space-y-3">

          <!-- Opção: Criar casa -->
          <button
            @click="modo = 'criar'"
            class="group w-full bg-white border border-[#f2f0ed] rounded-2xl p-5 text-left hover:border-[#ff3e00]/40 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
          >
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-[#ff3e00]/10 flex items-center justify-center group-hover:bg-[#ff3e00]/20 transition-colors">
                <Plus class="w-5 h-5 text-[#ff3e00]" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-[#343433] text-sm">Criar uma casa nova</p>
                <p class="text-xs text-[#848281] mt-0.5">Comece do zero e convide outras pessoas</p>
              </div>
              <ArrowRight class="w-4 h-4 text-[#c5c3c1] group-hover:text-[#ff3e00] transition-colors flex-shrink-0" />
            </div>
          </button>

          <!-- Opção: Entrar em uma casa -->
          <button
            @click="modo = 'entrar'"
            class="group w-full bg-white border border-[#f2f0ed] rounded-2xl p-5 text-left hover:border-[#121212]/30 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
          >
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-[#121212]/8 flex items-center justify-center group-hover:bg-[#121212]/12 transition-colors">
                <Key class="w-5 h-5 text-[#343433]" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-[#343433] text-sm">Entrar em uma casa existente</p>
                <p class="text-xs text-[#848281] mt-0.5">Use o código de convite que você recebeu</p>
              </div>
              <ArrowRight class="w-4 h-4 text-[#c5c3c1] group-hover:text-[#343433] transition-colors flex-shrink-0" />
            </div>
          </button>

          <!-- Separador -->
          <div class="pt-2">
            <button
              @click="$emit('logout')"
              class="w-full flex items-center justify-center gap-2 text-xs text-[#a7a7a7] hover:text-[#ff3e00] transition-colors py-2"
            >
              <LogOut class="w-3.5 h-3.5" />
              Sair da conta
            </button>
          </div>
        </div>

        <!-- Tela: Criar Casa -->
        <div v-else-if="modo === 'criar'" key="criar">
          <!-- Sucesso: Casa criada -->
          <Transition name="fade" mode="out-in">
            <div v-if="estado.casaCriada" key="sucesso" class="text-center space-y-6">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-2">
                <Check class="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-[#343433]">Casa criada! 🏡</h2>
                <p class="text-sm text-[#848281] mt-1">
                  <strong class="text-[#343433]">{{ estado.casaCriada.name }}</strong> está pronta.
                  Compartilhe o código abaixo para convidar outras pessoas:
                </p>
              </div>

              <div class="bg-[#f7f5f3] border border-[#ebe9e6] rounded-2xl p-5">
                <p class="text-xs text-[#a7a7a7] mb-1 uppercase tracking-wider font-medium">Código de convite</p>
                <p class="text-2xl font-bold text-[#ff3e00] tracking-widest font-mono">
                  {{ estado.casaCriada.inviteCode }}
                </p>
              </div>

              <button
                @click="irParaDashboard"
                class="w-full bg-[#121212] hover:bg-[#343433] text-white font-medium py-3.5 px-6 rounded-full text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                Ir para o Dashboard
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>

            <!-- Form: Criar -->
            <div v-else key="form-criar" class="space-y-5">
              <div class="flex items-center gap-3 mb-6">
                <button @click="voltar" class="text-[#a7a7a7] hover:text-[#343433] transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 class="text-base font-semibold text-[#343433]">Nova Casa</h2>
                  <p class="text-xs text-[#848281]">Dê um nome para a sua casa</p>
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-semibold text-[#474645] uppercase tracking-wider">
                  Nome da Casa
                </label>
                <input
                  v-model="nomeCasa"
                  type="text"
                  placeholder="Ex: Casa da Família Silva"
                  maxlength="60"
                  autofocus
                  @keydown.enter="criarCasa"
                  class="w-full bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-3 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00] focus:ring-1 focus:ring-[#ff3e00] transition-all duration-200"
                />
              </div>

              <Transition name="fade">
                <div v-if="estado.erro" class="bg-red-50 border border-red-200/60 text-red-600 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{{ estado.erro }}</span>
                </div>
              </Transition>

              <button
                @click="criarCasa"
                :disabled="estado.loading || !nomeCasa.trim()"
                class="w-full bg-[#ff3e00] hover:bg-[#e03500] disabled:opacity-50 text-white font-medium py-3.5 px-6 rounded-full text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <span v-if="estado.loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                <Home class="w-4 h-4" v-else />
                Criar Casa
              </button>
            </div>
          </Transition>
        </div>

        <!-- Tela: Entrar por Código -->
        <div v-else-if="modo === 'entrar'" key="entrar" class="space-y-5">
          <div class="flex items-center gap-3 mb-6">
            <button @click="voltar" class="text-[#a7a7a7] hover:text-[#343433] transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 class="text-base font-semibold text-[#343433]">Entrar em uma Casa</h2>
              <p class="text-xs text-[#848281]">Insira o código de convite</p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-semibold text-[#474645] uppercase tracking-wider">
              Código de Convite
            </label>
            <input
              v-model="codigoConvite"
              type="text"
              placeholder="Ex: CASA-AB12C"
              autofocus
              @keydown.enter="entrarCasa"
              class="w-full bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-3 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#121212] focus:ring-1 focus:ring-[#121212] transition-all duration-200 font-mono uppercase tracking-widest"
            />
          </div>

          <Transition name="fade">
            <div v-if="estado.erro" class="bg-red-50 border border-red-200/60 text-red-600 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{{ estado.erro }}</span>
            </div>
          </Transition>

          <button
            @click="entrarCasa"
            :disabled="estado.loading || !codigoConvite.trim()"
            class="w-full bg-[#121212] hover:bg-[#343433] disabled:opacity-50 text-white font-medium py-3.5 px-6 rounded-full text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <span v-if="estado.loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
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
  transition: all 0.25s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
