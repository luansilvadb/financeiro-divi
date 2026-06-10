import { ref } from 'vue'
import { tenantSessionService } from '../shared/container'

export function useLoginViewModel() {
  const email = ref('')
  const nome = ref('')
  const password = ref('')
  const errorMsg = ref('')
  const inviteCode = ref('')
  const membroId = ref('')
  const isAuthed = ref(tenantSessionService.isAuthenticated())

  const handleLogin = async () => {
    errorMsg.value = ''
    if (!email.value || !password.value) {
      errorMsg.value = 'Preencha o e-mail e a senha'
      return false
    }
    const success = await tenantSessionService.login(email.value, password.value)
    if (success) {
      isAuthed.value = true
    } else {
      errorMsg.value = 'Falha no login. E-mail ou senha incorretos.'
    }
    return success
  }

  const handleRegister = async () => {
    errorMsg.value = ''
    if (!email.value || !nome.value || !password.value) {
      errorMsg.value = 'Preencha o e-mail, nome e senha'
      return false
    }
    if (password.value.length < 6) {
      errorMsg.value = 'A senha deve ter no mínimo 6 caracteres'
      return false
    }
    const success = await tenantSessionService.register(
      email.value, 
      nome.value,
      password.value, 
      inviteCode.value, 
      membroId.value
    )
    if (success) {
      isAuthed.value = true
    } else {
      errorMsg.value = 'Erro ao cadastrar. Verifique os dados ou se o e-mail já existe.'
    }
    return success
  }

  return {
    email,
    nome,
    password,
    errorMsg,
    inviteCode,
    membroId,
    isAuthed,
    handleLogin,
    handleRegister
  }
}
