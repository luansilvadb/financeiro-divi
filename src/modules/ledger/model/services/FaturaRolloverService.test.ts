import { describe, it, expect, vi } from 'vitest'
import { FaturaRolloverService } from './FaturaRolloverService'
import { Gasto } from '../domain/Gasto'
import { Fatura } from '../domain/Fatura'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../domain/DivisaoDeGasto'

describe('FaturaRolloverService', () => {
  it('deve processar rollover de parcelas corretas', () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo, mockGastoRepo)

    const gastoParcelado = new Gasto({
      id: 'g1',
      faturaId: 'f-antiga',
      descricao: 'Curso',
      valorTotal: Dinheiro.deReais(200),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(200))],
      installments: 3,
      totalInstallments: 3
    })

    const gastoGrupoParcela = new Gasto({
      id: 'g2',
      faturaId: 'f-antiga',
      descricao: 'Geladeira',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(300))],
      installments: 3,
      totalInstallments: 3,
      grupoParcelasId: 'grupo1'
    })

    const novosGastos = service.processarRolloverParcelas('f-nova', [gastoParcelado, gastoGrupoParcela])

    // Deve processar apenas o gasto que NÃO tem grupoParcelasId
    expect(novosGastos.length).toBe(1)
    expect(novosGastos[0].faturaId).toBe('f-nova')
    expect(novosGastos[0].installments).toBe(2)
    expect(novosGastos[0].descricao).toBe('Curso')
  })

  it('deve gerar transacoes de netting de saldo inicial corretamente', () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo, mockGastoRepo)

    const saldos = {
      m1: 100, // Credor (a receber)
      m2: -60,  // Devedor (a pagar)
      m3: -40   // Devedor (a pagar)
    }

    const carryovers = service.gerarTransacoesNettingSaldoInicial('f-nova', 'Maio 2026', saldos)

    expect(carryovers.length).toBe(2)

    // O credor (m1) deve constar como compradorId (quem paga/recebe na modelagem do carryover)
    // O devedor deve constar na divisão
    const carry1 = carryovers.find(c => c.divisoes[0].membroId === 'm2')
    const carry2 = carryovers.find(c => c.divisoes[0].membroId === 'm3')

    expect(carry1).toBeDefined()
    expect(carry1?.compradorId).toBe('m1')
    expect(carry1?.valorTotal.centavos).toBe(6000)
    expect(carry1?.isSettlement).toBe(true)

    expect(carry2).toBeDefined()
    expect(carry2?.compradorId).toBe('m1')
    expect(carry2?.valorTotal.centavos).toBe(4000)
    expect(carry2?.isSettlement).toBe(true)
  })

  it('deve fechar faturas antigas e criar novas faturas no rollover de periodo', async () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo, mockGastoRepo)

    const faturaAntiga = new Fatura({
      id: 'f-antiga',
      cartaoId: 'c1',
      periodo: { mes: 5, ano: 2026 },
      responsavelId: 'm1',
      status: 'ABERTA'
    })

    mockGastoRepo.buscarPorFatura.mockResolvedValue([])

    await service.executarRolloverPeriodo({
      nomeNovoPeriodo: 'Junho 2026',
      faturasAbertas: [faturaAntiga],
      cartoes: [{ id: 'c1', responsavelPadraoId: 'm1' }],
      saldosAcumulados: { m1: 0 },
      nomePeriodoAnterior: 'Maio 2026'
    })

    // Deve fechar fatura antiga
    expect(faturaAntiga.status).toBe('FECHADA')
    expect(mockFaturaRepo.salvar).toHaveBeenCalledTimes(2) // 1 para fechar, 1 para salvar a nova fatura
  })
})
