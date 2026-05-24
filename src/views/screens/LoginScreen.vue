<script setup lang="ts">
import { ref } from 'vue'
import { useLoginViewModel } from '../../viewmodels/useLoginViewModel'

const emit = defineEmits(['auth-success'])

const {
  username,
  password,
  errorMsg,
  handleLogin,
  handleRegister
} = useLoginViewModel()

const isRegisterMode = ref(false)
const loading = ref(false)

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
        <p class="text-sm text-[#848281] max-w-[280px] mx-auto">
          O orquestrador financeiro de alta precisão para sua casa
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="onSubmit" class="space-y-5">
        <!-- Error Notification -->
        <Transition name="fade">
          <div v-if="errorMsg" class="bg-[#ff2b3a]/10 border border-[#ff2b3a]/20 text-[#ff2b3a] text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <span class="font-bold">⚠️</span>
            <span>{{ errorMsg }}</span>
          </div>
        </Transition>

        <!-- Username Input -->
        <div class="space-y-2">
          <label for="username" class="block text-xs font-semibold text-[#474645] uppercase tracking-wider">
            Nome de Usuário
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Ex: luansilva"
            autocomplete="username"
            class="w-full bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-3 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00] focus:ring-1 focus:ring-[#ff3e00] transition-all duration-200"
          />
        </div>

        <!-- Password Input -->
        <div class="space-y-2">
          <label for="password" class="block text-xs font-semibold text-[#474645] uppercase tracking-wider">
            Senha
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="current-password"
            class="w-full bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-3 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00] focus:ring-1 focus:ring-[#ff3e00] transition-all duration-200"
          />
        </div>

        <!-- Submit Button (Midnight Pill) -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#121212] hover:bg-[#343433] text-white font-medium py-3 px-6 rounded-full text-sm tracking-wide transition-all duration-200 shadow-md active:scale-98 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
          <span>{{ isRegisterMode ? 'Criar Conta' : 'Entrar' }}</span>
        </button>
      </form>

      <!-- Toggle Mode -->
      <div class="mt-8 pt-6 border-t border-[#f2f0ed] text-center">
        <p class="text-xs text-[#848281]">
          {{ isRegisterMode ? 'Já possui uma conta?' : 'Novo no DIVI?' }}
          <button
            type="button"
            class="ml-1 text-[#ff3e00] hover:underline font-semibold focus:outline-none"
            @click="isRegisterMode = !isRegisterMode; errorMsg = ''"
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
</style>
