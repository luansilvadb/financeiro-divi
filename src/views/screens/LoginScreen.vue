<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLoginViewModel } from '../../viewmodels/useLoginViewModel'
import { tenantSessionService } from '../../shared/container'
import IllustrationMascot from '../components/ui/IllustrationMascot.vue'
import MembroAvatar from '../components/ui/MembroAvatar.vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const emit = defineEmits(['auth-success'])

const {
  username,
  password,
  inviteCode,
  membroId,
  errorMsg,
  handleLogin,
  handleRegister
} = useLoginViewModel()

const isRegisterMode = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const housePreview = ref<any>(null)
const selectedMembroNome = ref('')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('invite')
  if (code) {
    inviteCode.value = code
    isRegisterMode.value = true
    try {
      housePreview.value = await tenantSessionService.getInvitePreview(code)
    } catch (e) {
      console.error('Falha ao carregar preview do convite:', e)
    }
  }
})

const selectMembro = (membro: any) => {
  membroId.value = membro.id
  selectedMembroNome.value = membro.nome
  username.value = membro.nome.toLowerCase().replace(/\s+/g, '.')
  isRegisterMode.value = true
}

const onSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const success = isRegisterMode.value ? await handleRegister() : await handleLogin()
    if (success) {
      emit('auth-success')
    }
  } catch (e: any) {
    errorMsg.value = e.message || 'Ocorreu um erro inesperado'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
    <!-- Card Container -->
    <div class="w-full max-w-[420px] bg-card rounded-2xl shadow-subtle p-8 sm:p-10 transition-all duration-300">
      
      <!-- Brand Logo / Header -->
      <div class="text-center mb-8 relative">
        <div class="inline-flex justify-center mb-4 transform hover:rotate-12 transition-transform duration-300 pointer-events-none">
          <IllustrationMascot variant="ember" :size="48" mood="happy" class="animate-wobble" />
        </div>
        <h1 class="text-display text-4xl mb-2">
          DIVI<span class="text-ember">.</span>
        </h1>
        
        <!-- Invite Context -->
        <div v-if="housePreview && !membroId" class="mt-8 p-6 bg-parchment rounded-card shadow-subtle border-none animate-in fade-in slide-in-from-top-4 duration-500 ease-spring">
          <p class="text-caption font-semibold text-ember uppercase tracking-widest mb-1">Você foi convidado para</p>
          <h2 class="text-heading text-charcoal mb-6">{{ housePreview.name }}</h2>
          
          <p class="text-caption font-semibold text-graphite uppercase tracking-widest mb-3">Quem é você na casa?</p>
          <div class="grid grid-cols-2 gap-3">
            <button 
              v-for="m in housePreview.membrosDisponiveis" 
              :key="m.id"
              @click="selectMembro(m)"
              :aria-label="'Entrar como ' + m.nome"
              class="flex flex-col items-center gap-3 p-4 rounded-xl bg-card shadow-subtle hover:scale-[1.02] active:scale-95 transition-all duration-300 text-center group border-none cursor-pointer"
            >
              <MembroAvatar :nome="m.nome" size="md" variant="sky" class="group-hover:scale-110 transition-transform duration-300" />
              <span class="text-[11px] font-bold text-charcoal truncate uppercase tracking-widest">{{ m.nome }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="membroId && membroId !== 'novo'" class="mt-8 p-6 bg-parchment rounded-card shadow-subtle border-none animate-in zoom-in-95 duration-300">
          <p class="text-body text-graphite">
            Criando acesso para <br/>
            <span class="text-heading text-charcoal">{{ selectedMembroNome }}</span><br/>
            <span class="text-caption text-graphite font-semibold uppercase tracking-widest">na casa {{ housePreview.name }}</span>
          </p>
          <button @click="membroId = ''" class="mt-4 text-caption font-semibold text-ember hover:opacity-80 transition-opacity uppercase tracking-widest bg-transparent border-none cursor-pointer">Alterar perfil</button>
        </div>

        <p v-else class="text-body text-graphite max-w-[280px] mx-auto mt-2">
          O orquestrador financeiro de alta precisão para sua casa
        </p>
      </div>

      <!-- Form (Show only if not choosing member or if member already selected) -->
      <Transition name="fade-slide" mode="out-in">
        <form v-if="!housePreview || membroId || !housePreview.membrosDisponiveis?.length" @submit.prevent="onSubmit" class="space-y-6 pt-4 border-t border-stone mt-8">
          <!-- Error Notification -->
          <Transition name="fade">
            <div 
              v-if="errorMsg" 
              role="alert"
              aria-live="assertive"
              class="bg-coral/10 text-coral text-caption px-4 py-3 rounded-card flex items-center gap-2 font-semibold"
            >
              <span aria-hidden="true">⚠️</span>
              <span>{{ errorMsg }}</span>
            </div>
          </Transition>

          <!-- Context Heading for Register -->
          <div v-if="isRegisterMode && housePreview" class="space-y-1">
            <h3 class="text-caption font-semibold text-graphite uppercase tracking-widest">Configurar Acesso</h3>
            <p class="text-xs text-graphite/70">Escolha um nome de usuário e senha para entrar.</p>
          </div>

          <!-- Username Input -->
          <div class="space-y-2">
            <label for="username" class="block text-caption font-semibold text-charcoal uppercase tracking-widest ml-1">
              Nome de Usuário
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              placeholder="Ex: luansilva"
              autocomplete="username"
              class="w-full bg-canvas border border-stone rounded-card px-4 py-3.5 text-body text-charcoal placeholder-smoke focus:outline-none focus:border-ember transition-all duration-200"
            />
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <label for="password" class="block text-caption font-semibold text-charcoal uppercase tracking-widest ml-1">
              Senha
            </label>
            <div class="relative group">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full bg-canvas border border-stone rounded-card px-4 py-3.5 pr-12 text-body text-charcoal placeholder-smoke focus:outline-none focus:border-ember transition-all duration-200"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-ember transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-ember/20 cursor-pointer bg-transparent border-none"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Esconder senha' : 'Mostrar senha'"
              >
                <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Submit Button (Midnight Pill) -->
          <button
            type="submit"
            :disabled="loading"
            :aria-busy="loading"
            :aria-label="loading ? (isRegisterMode ? 'Criando conta...' : 'Entrando...') : (isRegisterMode ? 'Criar Conta e Entrar' : 'Entrar')"
            class="w-full bg-midnight hover:bg-charcoal text-white font-semibold py-4 px-6 rounded-pill text-sm tracking-widest uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 border-none cursor-pointer"
          >
            <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" aria-hidden="true"></span>
            <span>{{ isRegisterMode ? 'Criar Conta e Entrar' : 'Entrar' }}</span>
          </button>
        </form>
      </Transition>

      <!-- Toggle Mode -->
      <div class="mt-8 pt-6 border-t border-stone text-center">
        <p class="text-caption text-graphite font-semibold">
          {{ isRegisterMode ? 'Já possui uma conta?' : 'Novo no DIVI?' }}
          <button
            type="button"
            class="ml-1 text-ember hover:opacity-80 font-bold focus:outline-none uppercase tracking-widest text-[10px] bg-transparent border-none cursor-pointer"
            @click="isRegisterMode = !isRegisterMode; errorMsg = ''; membroId = ''"
          >
            {{ isRegisterMode ? 'Faça login' : 'Crie sua conta' }}
          </button>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active {
  transition: all 0.4s var(--ease-spring);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
