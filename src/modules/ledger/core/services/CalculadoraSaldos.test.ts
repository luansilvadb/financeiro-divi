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
      origem_id: 'A',
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
      origem_id: 'A',
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
      origem_id: 'B',
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
      origem_id: 'A',
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
})
