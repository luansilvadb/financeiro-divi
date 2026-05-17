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

  it('deve calcular o extrato detalhado com saldo acumulado para um membro', () => {
    const t1 = new Transacao({
      id: 't1',
      descricao: 'Mercado',
      total: Dinheiro.deReais(100),
      pagamentos: [{ membro_id: 'luan', valor: Dinheiro.deReais(100) }],
      divisoes: [
        new Divisao('luan', Dinheiro.deReais(50)),
        new Divisao('maria', Dinheiro.deReais(50))
      ],
      status: 'pendente',
      data: new Date('2026-05-01')
    })

    const extrato = CalculadoraSaldos.obterExtratoMembro('luan', [t1])
    expect(extrato).toHaveLength(1)
    expect(extrato[0].valorLiquido.centavos).toBe(5000) // Pagou 100, consumiu 50
    expect(extrato[0].saldoAcumulado.centavos).toBe(5000)
  })

  it('deve ordenar transações por data e acumular saldo corretamente (3+ transações)', () => {
    const t1 = new Transacao({
      id: 't1',
      descricao: 'T1',
      total: Dinheiro.deReais(100),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(100) }],
      divisoes: [new Divisao('A', Dinheiro.deReais(50)), new Divisao('B', Dinheiro.deReais(50))],
      status: 'pendente',
      data: new Date('2026-05-10')
    })
    const t2 = new Transacao({
      id: 't2',
      descricao: 'T2',
      total: Dinheiro.deReais(40),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(40) }],
      divisoes: [new Divisao('A', Dinheiro.deReais(20)), new Divisao('B', Dinheiro.deReais(20))],
      status: 'pendente',
      data: new Date('2026-05-05') // Anterior a t1
    })
    const t3 = new Transacao({
      id: 't3',
      descricao: 'T3',
      total: Dinheiro.deReais(60),
      pagamentos: [{ membro_id: 'B', valor: Dinheiro.deReais(60) }],
      divisoes: [new Divisao('A', Dinheiro.deReais(30)), new Divisao('B', Dinheiro.deReais(30))],
      status: 'pendente',
      data: new Date('2026-05-15') // Posterior a t1
    })

    const extrato = CalculadoraSaldos.obterExtratoMembro('A', [t1, t2, t3])
    
    expect(extrato).toHaveLength(3)
    // Ordem esperada: t2 (05-05), t1 (05-10), t3 (05-15)
    expect(extrato[0].id).toBe('t2')
    expect(extrato[1].id).toBe('t1')
    expect(extrato[2].id).toBe('t3')

    // Saldos acumulados para A:
    // t2: +20 (Pago 40, cons 20) -> Acum: 20
    // t1: +50 (Pago 100, cons 50) -> Acum: 70
    // t3: -30 (Pago 0, cons 30) -> Acum: 40
    expect(extrato[0].saldoAcumulado.centavos).toBe(2000)
    expect(extrato[1].saldoAcumulado.centavos).toBe(7000)
    expect(extrato[2].saldoAcumulado.centavos).toBe(4000)
  })

  it('deve somar corretamente múltiplos pagamentos e divisões para o mesmo membro em uma transação', () => {
    const t1 = new Transacao({
      id: 't1',
      descricao: 'Jantar Complexo',
      total: Dinheiro.deReais(150),
      pagamentos: [
        { membro_id: 'A', valor: Dinheiro.deReais(50) },
        { membro_id: 'A', valor: Dinheiro.deReais(50) },
        { membro_id: 'B', valor: Dinheiro.deReais(50) }
      ],
      divisoes: [
        new Divisao('A', Dinheiro.deReais(30)),
        new Divisao('A', Dinheiro.deReais(20)),
        new Divisao('B', Dinheiro.deReais(100))
      ],
      status: 'pendente',
      data: new Date('2026-05-01')
    })

    const extrato = CalculadoraSaldos.obterExtratoMembro('A', [t1])
    
    // A: Pagou 50+50 = 100. Consumiu 30+20 = 50. Liquido = +50.
    expect(extrato[0].valorPago.centavos).toBe(10000)
    expect(extrato[0].valorConsumido.centavos).toBe(5000)
    expect(extrato[0].valorLiquido.centavos).toBe(5000)
    })

    it('deve filtrar membros que possuem saldo zero (quitados)', () => {
    const t = new Transacao({
      id: 't1',
      descricao: 'Teste',
      total: Dinheiro.deReais(10),
      pagamentos: [{ membro_id: 'ana', valor: Dinheiro.deReais(10) }],
      divisoes: [new Divisao('ana', Dinheiro.deReais(10))], // Ana pagou e consumiu o mesmo
      status: 'pendente',
      data: new Date()
    })

    const saldos = CalculadoraSaldos.calcular([t])
    expect(saldos.has('ana')).toBe(false)
    expect(saldos.size).toBe(0)
  })

  it('deve encontrar o menor número de transferências em cenários fragmentados', () => {
    const saldos = new Map([
      ['alice', Dinheiro.deCentavos(500)],
      ['bob', Dinheiro.deCentavos(-300)],
      ['carol', Dinheiro.deCentavos(100)],
      ['dan', Dinheiro.deCentavos(-300)]
    ])
    
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    // Verifica se o total de transferências é otimizado (geralmente 3 aqui)
    expect(acertos.length).toBeLessThanOrEqual(3)
    
    // Verifica se os saldos finais seriam zerados
    const saldosFinais = new Map(saldos)
    acertos.forEach(a => {
      saldosFinais.set(a.de, saldosFinais.get(a.de)!.somar(a.valor))
      saldosFinais.set(a.para, saldosFinais.get(a.para)!.subtrair(a.valor))
    })
    
    for (const saldo of saldosFinais.values()) {
      expect(saldo.isZero()).toBe(true)
    }
  })
})

