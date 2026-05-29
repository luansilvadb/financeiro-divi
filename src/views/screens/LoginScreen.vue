<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLoginViewModel } from '../../viewmodels/useLoginViewModel'
import { tenantSessionService } from '../../shared/container'

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
const housePreview = ref<any>(null)
const selectedMembroNome = ref('')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('invite')
  if (code) {
    inviteCode.value = code
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
  <div class="min-h-screen bg-[#fbfaf9] flex items-center justify-center px-4 py-12">
    <!-- Card Container -->
    <div class="w-full max-w-[420px] bg-white rounded-2xl shadow-subtle border border-[#f2f0ed] p-8 sm:p-10 transition-all duration-300">
      
      <!-- Brand Logo / Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ff3e00] text-white font-bold text-2xl mb-4 transform hover:rotate-12 transition-transform duration-300">
          ÷
        </div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#343433] mb-2">
          DIVI
        </h1>
        
        <!-- Invite Context -->
        <div v-if="housePreview && !membroId" class="mt-8 p-6 bg-parchment rounded-card shadow-subtle-3 border border-stone animate-in fade-in slide-in-from-top-4 duration-500 ease-spring">
          <p class="text-caption font-bold text-ember uppercase tracking-widest mb-1">Você foi convidado para</p>
          <h2 class="text-heading text-charcoal mb-6">{{ housePreview.name }}</h2>
          
          <p class="text-caption font-bold text-ash uppercase tracking-widest mb-3">Quem é você na casa?</p>
          <div class="grid grid-cols-2 gap-3">
            <button 
              v-for="m in housePreview.membrosDisponiveis" 
              :key="m.id"
              @click="selectMembro(m)"
              class="flex items-center gap-3 p-3 rounded-lg bg-card shadow-subtle hover:shadow-sm active:scale-95 transition-all duration-300 text-left group"
            >
              <div class="w-10 h-10 rounded-full bg-stone flex items-center justify-center text-xs font-bold text-charcoal group-hover:bg-ember/10 group-hover:text-ember transition-colors">
                {{ m.nome.substring(0,2).toUpperCase() }}
              </div>
              <span class="text-body font-bold text-charcoal truncate">{{ m.nome }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="membroId && membroId !== 'novo'" class="mt-8 p-6 bg-parchment rounded-card border border-stone animate-in zoom-in-95 duration-300">
          <p class="text-body text-graphite">
            Criando acesso para <br/>
            <span class="text-heading text-charcoal">{{ selectedMembroNome }}</span><br/>
            <span class="text-caption text-ash font-bold uppercase tracking-widest">na casa {{ housePreview.name }}</span>
          </p>
          <button @click="membroId = ''" class="mt-4 text-caption font-bold text-ember hover:underline">Alterar perfil</button>
        </div>

        <p v-else class="text-body text-graphite max-w-[280px] mx-auto mt-2">
          O orquestrador financeiro de alta precisão para sua casa
        </p>
      </div>

      <!-- Form (Show only if not choosing member or if member already selected) -->
      <Transition name="fade-slide" mode="out-in">
        <form v-if="!housePreview || membroId || !housePreview.membrosDisponiveis?.length" @submit.prevent="onSubmit" class="space-y-6 pt-4 border-t border-stone/30 mt-8">
          <!-- Error Notification -->
          <Transition name="fade">
            <div v-if="errorMsg" class="bg-coral/10 border border-coral/20 text-coral text-caption px-4 py-3 rounded-card flex items-center gap-2">
              <span class="font-bold">⚠️</span>
              <span>{{ errorMsg }}</span>
            </div>
          </Transition>

          <!-- Context Heading for Register -->
          <div v-if="isRegisterMode && housePreview" class="space-y-1">
            <h3 class="text-caption font-bold text-ash uppercase tracking-widest">Configurar Acesso</h3>
            <p class="text-xs text-graphite/60">Escolha um nome de usuário e senha para entrar.</p>
          </div>

          <!-- Username Input -->
          <div class="space-y-2">
            <label for="username" class="block text-caption font-bold text-charcoal uppercase tracking-widest ml-1">
              Nome de Usuário
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              placeholder="Ex: luansilva"
              autocomplete="username"
              class="w-full bg-canvas border border-stone rounded-card px-4 py-3.5 text-body text-charcoal placeholder-smoke focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all duration-200"
            />
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <label for="password" class="block text-caption font-bold text-charcoal uppercase tracking-widest ml-1">
              Senha
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full bg-canvas border border-stone rounded-card px-4 py-3.5 text-body text-charcoal placeholder-smoke focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all duration-200"
            />
          </div>

          <!-- Submit Button (Midnight Pill) -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-midnight hover:bg-charcoal text-white font-bold py-4 px-6 rounded-pill text-sm tracking-widest uppercase transition-all duration-300 shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
            <span>{{ isRegisterMode ? 'Criar Conta e Entrar' : 'Entrar' }}</span>
          </button>
        </form>
      </Transition>

      <!-- Toggle Mode -->
      <div class="mt-8 pt-6 border-t border-stone/30 text-center">
        <p class="text-caption text-ash font-medium">
          {{ isRegisterMode ? 'Já possui uma conta?' : 'Novo no DIVI?' }}
          <button
            type="button"
            class="ml-1 text-ember hover:underline font-bold focus:outline-none uppercase tracking-widest text-[10px]"
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
