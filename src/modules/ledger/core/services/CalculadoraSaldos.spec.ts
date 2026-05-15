import { describe, it, expect } from 'vitest'
import { CalculadoraSaldos } from './CalculadoraSaldos'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('CalculadoraSaldos - Auditoria de Acertos', () => {
  it('deve liquidar uma dívida simples 1-para-1', () => {
    const saldos = new Map([
      ['user1', Dinheiro.deCentavos(-1000)], // Deve 10
      ['user2', Dinheiro.deCentavos(1000)]   // Tem 10 a receber
    ])
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    expect(acertos).toHaveLength(1)
    expect(acertos[0]).toEqual({
      de: 'user1',
      para: 'user2',
      valor: Dinheiro.deCentavos(1000)
    })
  })

  it('deve liquidar corretamente divisões com dízimas de centavos', () => {
    // Cenário: Compra de R$ 1,00 dividida por 3.
    // P1 pagou 100. P1 consumiu 34. P2 consumiu 33. P3 consumiu 33.
    // Saldos: P1 (+66), P2 (-33), P3 (-33)
    const saldos = new Map([
      ['p1', Dinheiro.deCentavos(66)],
      ['p2', Dinheiro.deCentavos(-33)],
      ['p3', Dinheiro.deCentavos(-33)]
    ])
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    
    // Total liquidado deve ser 66 centavos
    const totalLiquidado = acertos.reduce((acc, a) => acc.somar(a.valor), Dinheiro.deCentavos(0))
    expect(totalLiquidado.centavos).toBe(66)
    expect(acertos).toHaveLength(2)
  })

  it('deve manter a conservação de dinheiro (soma dos créditos == soma dos débitos)', () => {
    const saldos = new Map([
      ['A', Dinheiro.deCentavos(-100)],
      ['B', Dinheiro.deCentavos(-200)],
      ['C', Dinheiro.deCentavos(300)]
    ])
    
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    
    // Todos os saldos devem ser zerados após os acertos
    const saldosFinais = new Map(saldos)
    for (const acerto of acertos) {
      const deSaldo = saldosFinais.get(acerto.de)!
      const paraSaldo = saldosFinais.get(acerto.para)!
      
      saldosFinais.set(acerto.de, deSaldo.somar(acerto.valor))
      saldosFinais.set(acerto.para, paraSaldo.subtrair(acerto.valor))
    }
    
    for (const saldo of saldosFinais.values()) {
      expect(saldo.isZero()).toBe(true)
    }
  })

  it('deve otimizar o número de transações em cenários complexos', () => {
    // Cenário:
    // A deve 10, B deve 10, C recebe 20.
    // D deve 20, E recebe 10, F recebe 10.
    // Total de pessoas (N) = 6. Limite superior de transações = N - 1 = 5.
    // Com o algoritmo greedy atual (maiores valores primeiro), 
    // D paga C (20), A paga E (10), B paga F (10). Total = 3 transações.
    const saldos = new Map([
      ['A', Dinheiro.deCentavos(-1000)],
      ['B', Dinheiro.deCentavos(-1000)],
      ['C', Dinheiro.deCentavos(2000)],
      ['D', Dinheiro.deCentavos(-2000)],
      ['E', Dinheiro.deCentavos(1000)],
      ['F', Dinheiro.deCentavos(1000)]
    ])
    
    const acertos = CalculadoraSaldos.calcularAcertos(saldos)
    
    // Verificamos se liquidou tudo
    const totalLiquidado = acertos.reduce((acc, a) => acc.somar(a.valor), Dinheiro.deCentavos(0))
    expect(totalLiquidado.centavos).toBe(4000)
    
    // O algoritmo deve ser eficiente (3 transações é o ideal aqui)
    expect(acertos.length).toBeLessThanOrEqual(5)
    expect(acertos.length).toBe(3)
  })

  it('deve lançar erro se os saldos estiverem desbalanceados', () => {
    const saldos = new Map([
      ['A', Dinheiro.deCentavos(-1000)],
      ['B', Dinheiro.deCentavos(500)] // Falta 500 para balancear
    ])
    
    expect(() => CalculadoraSaldos.calcularAcertos(saldos)).toThrow('Erro de integridade')
  })
})
