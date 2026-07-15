import { describe, it, expect } from 'vitest'
import { obterCorCartao } from './obterCorCartao'

describe('obterCorCartao', () => {
  it('deve retornar cinza ash padrão se o nome for vazio ou nulo', () => {
    expect(obterCorCartao('')).toBe('#848281')
  })

  it('deve identificar o roxo para cartões Nubank', () => {
    expect(obterCorCartao('Nubank')).toBe('#a855f7')
    expect(obterCorCartao('nu de luan')).toBe('#a855f7')
    expect(obterCorCartao('NUBANK')).toBe('#a855f7')
  })

  it('deve identificar o preto para cartões C6, Carbon ou Black', () => {
    expect(obterCorCartao('C6 Carbon')).toBe('#1e1b18')
    expect(obterCorCartao('C6 Bank')).toBe('#1e1b18')
    expect(obterCorCartao('Itaú Black')).toBe('#1e1b18')
  })

  it('deve identificar o laranja para cartões Banco Inter', () => {
    expect(obterCorCartao('Banco Inter')).toBe('#f97316')
    expect(obterCorCartao('inter platinum')).toBe('#f97316')
  })

  it('deve identificar o azul para cartões Itaú', () => {
    expect(obterCorCartao('Itaú')).toBe('#3b82f6')
    expect(obterCorCartao('Itau Click')).toBe('#3b82f6')
  })

  it('deve identificar o vermelho para Bradesco ou Santander', () => {
    expect(obterCorCartao('Bradesco')).toBe('#ef4444')
    expect(obterCorCartao('Santander SX')).toBe('#ef4444')
  })

  it('deve retornar uma cor consistente para outros nomes baseando-se no hash', () => {
    const cor1 = obterCorCartao('Meu cartao customizado')
    const cor2 = obterCorCartao('Meu cartao customizado')
    expect(cor1).toBe(cor2) // Deve ser consistente
    
    // Deve escolher uma cor da paleta permitida
    const coresConsistentes = [
      '#a855f7', '#3b82f6', '#f97316', '#10b981', '#ef4444', '#474645'
    ]
    expect(coresConsistentes).toContain(cor1)
  })
})
