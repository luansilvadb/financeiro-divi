import { describe, it, expect } from 'vitest'
import { mensagemErro } from './mensagemErro'

describe('mensagemErro', () => {
  it('deve retornar erro.message quando erro for uma instância de Error com mensagem', () => {
    const erro = new Error('Mensagem customizada')
    const fallback = 'Erro padrão'
    expect(mensagemErro(erro, fallback)).toBe('Mensagem customizada')
  })

  it('deve retornar fallback quando erro for uma instância de Error mas message estiver vazia', () => {
    const erro = new Error('')
    const fallback = 'Erro padrão'
    expect(mensagemErro(erro, fallback)).toBe(fallback)
  })

  it('deve retornar fallback quando erro for uma string', () => {
    const erro = 'Erro em string'
    const fallback = 'Erro padrão'
    expect(mensagemErro(erro, fallback)).toBe(fallback)
  })

  it('deve retornar fallback quando erro for um objeto simples', () => {
    const erro = { message: 'Não sou Error' }
    const fallback = 'Erro padrão'
    expect(mensagemErro(erro, fallback)).toBe(fallback)
  })

  it('deve retornar fallback quando erro for null', () => {
    const fallback = 'Erro padrão'
    expect(mensagemErro(null, fallback)).toBe(fallback)
  })

  it('deve retornar fallback quando erro for undefined', () => {
    const fallback = 'Erro padrão'
    expect(mensagemErro(undefined, fallback)).toBe(fallback)
  })
})
