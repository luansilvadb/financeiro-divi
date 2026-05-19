import { describe, it, expect, beforeEach } from 'vitest'
import { useFaturaRollover } from './useFaturaRollover'
import { Gasto } from '../core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'

describe('useFaturaRollover', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve decrementar parcelamentos ativos corretamente', () => {
    const { processarRolloverParcelas } = useFaturaRollover()
    
    const gastoParcelado = new Gasto({
      id: 'gp1',
      faturaId: 'fat_velha',
      descricao: 'Geladeira',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(300))],
      installments: 3
    })

    const gastoFinal = new Gasto({
      id: 'gp2',
      faturaId: 'fat_velha',
      descricao: 'Hamburguer',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(50))],
      installments: 1
    })

    const novosGastos = processarRolloverParcelas('fat_nova', [gastoParcelado, gastoFinal])
    
    expect(novosGastos.length).toBe(1)
    expect(novosGastos[0].installments).toBe(2) // Decrementou!
    expect(novosGastos[0].totalInstallments).toBe(3) // Manteve o total original!
    expect(novosGastos[0].id).not.toBe('gp1') // ID é único/novo!
    expect(novosGastos[0].faturaId).toBe('fat_nova')
    expect(novosGastos[0].descricao).toBe('Geladeira')
  })

  it('deve gerar transacao de saldo inicial por netting de saldos finais', () => {
    const { gerarTransacoesNettingSaldoInicial } = useFaturaRollover()

    // Luciana com saldo credor (+R$ 100,00), Luan com saldo devedor (-R$ 100,00)
    const saldos = {
      luciana: 100.00,
      luan: -100.00,
      joao: 0.00
    }

    const carryovers = gerarTransacoesNettingSaldoInicial('fat_nova', 'Maio 2026', saldos)
    
    expect(carryovers.length).toBe(1)
    expect(carryovers[0].valorTotal.centavos).toBe(10000)
    expect(carryovers[0].compradorId).toBe('luciana') // Credor recebe
    expect(carryovers[0].divisoes.length).toBe(1)
    expect(carryovers[0].divisoes[0].membroId).toBe('luan') // Devedor paga 100%
    expect(carryovers[0].isSettlement).toBe(true)
    expect(carryovers[0].descricao).toBe('Saldo Inicial Pendente (Maio 2026)')
  })
})
