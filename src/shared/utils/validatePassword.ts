/**
 * Valida uma senha contra os requisitos do backend (internal/validator/validator.go).
 *
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Máximo 128 caracteres (proteção contra bcrypt DoS)
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 *
 * @returns Mensagem de erro amigável, ou `null` se a senha for válida.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.'
  }
  if (password.length > 128) {
    return 'A senha deve ter no máximo 128 caracteres.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra maiúscula.'
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra minúscula.'
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve conter pelo menos um número.'
  }
  return null
}
