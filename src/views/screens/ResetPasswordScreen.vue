<script setup lang="ts">
import { ref } from 'vue'
import { tenantSessionService } from '../../shared/container'
import IllustrationMascot from '../components/ui/IllustrationMascot.vue'

const props = defineProps<{
  token: string
}>()

const emit = defineEmits(['reset-success'])

const newPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

const onSubmit = async () => {
  if (newPassword.value.length < 6) {
    errorMsg.value = 'A senha deve ter no mínimo 6 caracteres.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    const success = await tenantSessionService.resetPassword(props.token, newPassword.value)
    if (success) {
      // Remover token da URL
      window.history.replaceState({}, document.title, window.location.pathname)
      emit('reset-success')
    } else {
      errorMsg.value = 'O link é inválido ou expirou. Solicite um novo link de recuperação.'
    }
  } catch (e: any) {
    errorMsg.value = e.message || 'Erro inesperado'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-[420px] bg-card rounded-2xl shadow-subtle p-8 sm:p-10 transition-all duration-300">
      <div class="text-center mb-8 relative">
        <div class="inline-flex justify-center mb-4 transform hover:rotate-12 transition-transform duration-300 pointer-events-none">
          <IllustrationMascot variant="ember" :size="48" mood="happy" class="animate-wobble" />
        </div>
        <h1 class="text-display text-3xl mb-2">
          Nova Senha<span class="text-ember">.</span>
        </h1>
        <p class="text-body text-graphite mt-2">
          Crie uma nova senha segura para o seu acesso.
        </p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <Transition name="fade">
          <div v-if="errorMsg" class="bg-coral/10 text-coral text-caption px-4 py-3 rounded-card flex items-center gap-2 font-semibold">
            ⚠️ {{ errorMsg }}
          </div>
        </Transition>

        <div class="space-y-2">
          <label for="password" class="block text-caption font-semibold text-charcoal uppercase tracking-widest ml-1">
            Nova Senha
          </label>
          <input
            id="password"
            v-model="newPassword"
            type="password"
            required
            placeholder="••••••••"
            class="w-full bg-canvas border border-stone rounded-card px-4 py-3.5 text-body text-charcoal placeholder-smoke focus:outline-none focus:border-ember transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-midnight hover:bg-charcoal text-white font-semibold py-4 px-6 rounded-pill text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
          <span>Redefinir Senha</span>
        </button>
      </form>
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
