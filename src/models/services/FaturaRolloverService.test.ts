import { describe, it, expect, vi } from 'vitest'
import { FaturaRolloverService } from './FaturaRolloverService'
import { Gasto } from '../entities/Gasto'
import { Fatura } from '../entities/Fatura'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

describe('FaturaRolloverService', () => {
  it('deve processar rollover de parcelas corretas', () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaService = { fecharFatura: vi.fn(), reabrirFatura: vi.fn(), assegurarFaturasAbertas: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo as any, mockGastoRepo as any, mockFaturaService as any)

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

    expect(novosGastos.length).toBe(1)
    expect(novosGastos[0].faturaId).toBe('f-nova')
    expect(novosGastos[0].installments).toBe(2)
    expect(novosGastos[0].descricao).toBe('Curso')
  })

  it('deve gerar transacoes de netting de saldo inicial corretamente', () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaService = { fecharFatura: vi.fn(), reabrirFatura: vi.fn(), assegurarFaturasAbertas: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo as any, mockGastoRepo as any, mockFaturaService as any)

    const saldos = {
      m1: 10000,
      m2: -6000,
      m3: -4000
    }

    const carryovers = service.gerarTransacoesNettingSaldoInicial('f-nova', 'Maio 2026', saldos)

    expect(carryovers.length).toBe(2)

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

  it('deve gerar carryovers com IDs deterministicos e desduplicáveis (Fix F-07)', () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaService = { fecharFatura: vi.fn(), reabrirFatura: vi.fn(), assegurarFaturasAbertas: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo as any, mockGastoRepo as any, mockFaturaService as any)

    const saldos = { m1: 10000, m2: -10000 }
    const carryovers1 = service.gerarTransacoesNettingSaldoInicial('f-nova', 'Maio 2026', saldos)
    const carryovers2 = service.gerarTransacoesNettingSaldoInicial('f-nova', 'Maio 2026', saldos)

    expect(carryovers1[0].id).toBe('carryover-f-nova-m2-m1-10000')
    expect(carryovers1[0].id).toBe(carryovers2[0].id)
  })

  it('deve fechar faturas abertas ao encerrar periodo', async () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn().mockResolvedValue([]), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const faturaAberta = new Fatura({
      id: 'f-antiga',
      cartaoId: 'c1',
      periodo: { mes: 5, ano: 2026 },
      responsavelId: 'm1',
      status: 'ABERTA'
    })
    const mockFaturaService = {
      fecharFatura: vi.fn().mockResolvedValue(undefined),
      reabrirFatura: vi.fn(),
      assegurarFaturasAbertas: vi.fn()
    }
    const service = new FaturaRolloverService(mockFaturaRepo as any, mockGastoRepo as any, mockFaturaService as any)

    await service.executarRolloverPeriodo({
      nomeNovoPeriodo: 'Junho 2026',
      faturasAbertas: [faturaAberta],
      cartoes: [{ id: 'c1', responsavelPadraoId: 'm1' }],
      saldosAcumulados: { m1: 0 },
      nomePeriodoAnterior: 'Maio 2026'
    })

    expect(mockFaturaService.fecharFatura).toHaveBeenCalledWith('f-antiga', 'm1', expect.any(Date))
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      cartaoId: 'PIX_DEFAULT_ID',
      periodo: { mes: 6, ano: 2026 },
      status: 'ABERTA'
    }))
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      cartaoId: 'c1',
      periodo: { mes: 6, ano: 2026 },
      status: 'ABERTA'
    }))
  })

  it('deve executar rollover e criar novo periodo mesmo se faturasAbertas for vazio', async () => {
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaService = { fecharFatura: vi.fn(), reabrirFatura: vi.fn(), assegurarFaturasAbertas: vi.fn() }
    const service = new FaturaRolloverService(mockFaturaRepo as any, mockGastoRepo as any, mockFaturaService as any)

    await service.executarRolloverPeriodo({
      nomeNovoPeriodo: 'Junho 2026',
      faturasAbertas: [],
      cartoes: [{ id: 'c1', responsavelPadraoId: 'm1' }],
      saldosAcumulados: { m1: 10000, m2: -10000 },
      nomePeriodoAnterior: 'Maio 2026'
    })

    // Deve salvar a fatura PIX e a do cartão no novo período
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      cartaoId: 'PIX_DEFAULT_ID',
      periodo: { mes: 6, ano: 2026 },
      status: 'ABERTA'
    }))
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      cartaoId: 'c1',
      periodo: { mes: 6, ano: 2026 },
      status: 'ABERTA'
    }))

    // Deve ter processado carryover de netting (saldo inicial pendente)
    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      id: 'carryover-PIX_DEFAULT_ID-6-2026-m2-m1-10000',
      descricao: 'Saldo Inicial Pendente (Maio 2026)'
    }))
  })
})
