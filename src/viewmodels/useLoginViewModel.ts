import { ref } from 'vue'
import { tenantSessionService } from '../shared/container'

export function useLoginViewModel() {
  const username = ref('')
  const password = ref('')
  const errorMsg = ref('')
  const inviteCode = ref('')
  const membroId = ref('')
  const isAuthed = ref(tenantSessionService.isAuthenticated())

  const handleLogin = async () => {
    errorMsg.value = ''
    if (!username.value || !password.value) {
      errorMsg.value = 'Preencha o nome e a senha'
      return false
    }
    const success = await tenantSessionService.login(username.value, password.value)
    if (success) {
      isAuthed.value = true
      localStorage.setItem('divi_username', username.value)
    } else {
      errorMsg.value = 'Falha no login. Nome ou senha incorretos.'
    }
    return success
  }

  const handleRegister = async () => {
    errorMsg.value = ''
    if (!username.value || !password.value) {
      errorMsg.value = 'Preencha o nome e a senha'
      return false
    }
    if (username.value.length < 3) {
      errorMsg.value = 'O nome de usuário deve ter no mínimo 3 caracteres'
      return false
    }
    const success = await tenantSessionService.register(
      username.value, 
      password.value, 
      inviteCode.value, 
      membroId.value
    )
    if (success) {
      isAuthed.value = true
      localStorage.setItem('divi_username', username.value)
    } else {
      errorMsg.value = 'Erro ao cadastrar. Esse nome de usuário já está em uso.'
    }
    return success
  }

  const handleLogout = async () => {
    await tenantSessionService.logout()
    isAuthed.value = false
    localStorage.removeItem('divi_username')
  }

  return {
    username,
    password,
    errorMsg,
    inviteCode,
    membroId,
    isAuthed,
    handleLogin,
    handleRegister,
    handleLogout
  }
}
