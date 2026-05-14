import { describe, it, expect } from 'vitest'
import { CalculadoraSaldos } from './CalculadoraSaldos'
import { Transacao } from '../domain/Transacao'
import { Divisao } from '../domain/Divisao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('CalculadoraSaldos', () => {
  it('deve calcular saldos corretamente em uma divisão simples entre dois membros', () => {
    // Membro A paga 100, dividido entre A e B (50 cada)
    const transacao = new Transacao({
      id: '1',
      descricao: 'Aluguel',
      total: Dinheiro.deReais(100),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(100) }],
      pagador_id: 'A',
      status: 'pendente',
      data: new Date(),
      divisoes: [
        new Divisao('A', Dinheiro.deReais(50)),
        new Divisao('B', Dinheiro.deReais(50))
      ]
    })

    const saldos = CalculadoraSaldos.calcular([transacao])

    expect(saldos.get('A')?.centavos).toBe(5000) // +50
    expect(saldos.get('B')?.centavos).toBe(-5000) // -50
  })

  it('deve acumular saldos de múltiplas transações', () => {
    // T1: A paga 100, dividido A/B (50/50) -> A:+50, B:-50
    const t1 = new Transacao({
      id: '1',
      descricao: 'T1',
      total: Dinheiro.deReais(100),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(100) }],
      pagador_id: 'A',
      status: 'pendente',
      data: new Date(),
      divisoes: [
        new Divisao('A', Dinheiro.deReais(50)),
        new Divisao('B', Dinheiro.deReais(50))
      ]
    })

    // T2: B paga 40, dividido A/B (20/20) -> A:-20, B:+20
    const t2 = new Transacao({
      id: '2',
      descricao: 'T2',
      total: Dinheiro.deReais(40),
      pagamentos: [{ membro_id: 'B', valor: Dinheiro.deReais(40) }],
      pagador_id: 'B',
      status: 'pendente',
      data: new Date(),
      divisoes: [
        new Divisao('A', Dinheiro.deReais(20)),
        new Divisao('B', Dinheiro.deReais(20))
      ]
    })

    const saldos = CalculadoraSaldos.calcular([t1, t2])

    expect(saldos.get('A')?.centavos).toBe(3000) // 50 - 20 = 30
    expect(saldos.get('B')?.centavos).toBe(-3000) // -50 + 20 = -30
  })

  it('deve calcular corretamente quando o pagador não é um beneficiário', () => {
    // A paga 60 para B e C (30 cada)
    const transacao = new Transacao({
      id: '1',
      descricao: 'Presente',
      total: Dinheiro.deReais(60),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(60) }],
      pagador_id: 'A',
      status: 'pendente',
      data: new Date(),
      divisoes: [
        new Divisao('B', Dinheiro.deReais(30)),
        new Divisao('C', Dinheiro.deReais(30))
      ]
    })

    const saldos = CalculadoraSaldos.calcular([transacao])

    expect(saldos.get('A')?.centavos).toBe(6000) // +60
    expect(saldos.get('B')?.centavos).toBe(-3000) // -30
    expect(saldos.get('C')?.centavos).toBe(-3000) // -30
  })

  it('deve retornar mapa vazio para lista de transações vazia', () => {
    const saldos = CalculadoraSaldos.calcular([])
    expect(saldos.size).toBe(0)
  })

  it('deve calcular acertos (quem paga quem) corretamente', () => {
    const saldos = new Map<string, Dinheiro>([
      ['A', Dinheiro.deReais(10)],  // Credor (+10)
      ['B', Dinheiro.deReais(-10)], // Devedor (-10)
    ])
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    expect(acertos).toHaveLength(1)
    expect(acertos[0].de).toBe('B')
    expect(acertos[0].para).toBe('A')
    expect(acertos[0].valor.centavos).toBe(1000)
  })

  it('deve lidar com múltiplos credores e devedores no netting', () => {
    const saldos = new Map<string, Dinheiro>([
      ['A', Dinheiro.deReais(50)],  // Credor (+50)
      ['B', Dinheiro.deReais(-30)], // Devedor (-30)
      ['C', Dinheiro.deReais(-20)], // Devedor (-20)
    ])
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    
    // B deve pagar 30 para A, C deve pagar 20 para A
    expect(acertos).toContainEqual(expect.objectContaining({ de: 'B', para: 'A' }))
    expect(acertos).toContainEqual(expect.objectContaining({ de: 'C', para: 'A' }))
    
    const totalAcertado = acertos.reduce((acc, a) => acc + a.valor.centavos, 0)
    expect(totalAcertado).toBe(5000)
  })
})
