import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Gasto } from '../entities/Gasto'

describe('GastoService', () => {
  it('deve lancar um gasto simples com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])
    mockFaturaRepo.listarTodas.mockResolvedValue([{ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'pix',
      compradorId: 'm1',
      valor: 100,
      descricao: 'Almoço',
      divisoes: [{ membroId: 'm1', valor: Dinheiro.deReais(100) }],
      installments: 1,
      cardOwnerId: null,
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalled()
  })

  it('deve lancar gasto de conta fixa com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.lancarGastoContaFixa({
      faturaId: 'f1',
      conta: { id: 'aluguel', name: 'Aluguel' },
      valorTotal: 1200,
      compradorId: 'm1',
      participantes: ['m1', 'm2']
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.any(Object))
  })

  it('deve atualizar um gasto completo com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const originalGasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Aluguel antigo',
      valorTotal: Dinheiro.deReais(1000),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(1000))],
      isLoan: false,
      borrowerId: null,
      recurringBillId: 'aluguel',
      isSettlement: false,
      settlementDetails: null
    })
    mockGastoRepo.buscarPorId.mockResolvedValue(originalGasto)

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.atualizarGastoCompleto('g1', {
      descricao: 'Aluguel atualizado',
      valorTotal: Dinheiro.deReais(1200),
      compradorId: 'm1',
      method: 'pix',
      cardOwner: null,
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(1200))],
      installments: 1
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalled()
  })

  it('deve resolver corretamente o dono do cartao e salvar com o responsavel do cartao quando o comprador for diferente', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    // Membro B é o dono do cartão. Membro A é o comprador.
    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c-premium', responsavelPadraoId: 'membro-b' }])
    mockFaturaRepo.listarTodas.mockResolvedValue([]) // Força a criação de uma nova fatura

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'card',
      compradorId: 'membro-a',
      valor: 200,
      descricao: 'Jantar',
      divisoes: [{ membroId: 'membro-a', valor: Dinheiro.deReais(200) }],
      installments: 1,
      cardOwnerId: 'c-premium', // Passa o ID do cartão cadastrado
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })

    // Deve salvar a Fatura com responsavelId = membro-b (dono do cartão)
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      cartaoId: 'c-premium',
      responsavelId: 'membro-b'
    }))

    // Deve salvar o Gasto com compradorId = membro-a e cardOwner = membro-b
    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      compradorId: 'membro-a',
      cardOwner: 'membro-b'
    }))
  })

  it('deve atualizar todas as parcelas do mesmo grupo mantendo os IDs e faturas quando installments permanece igual', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Original 1/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 2,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    const g2 = new Gasto({
      id: 'g2',
      faturaId: 'f2',
      descricao: 'Original 2/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    
    await service.atualizarGastoCompleto('g1', {
      descricao: 'Atualizado',
      valorTotal: Dinheiro.deReais(120),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(6000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(6000))],
      installments: 2
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalledTimes(2)
    
    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Atualizado',
      valorTotal: expect.objectContaining({ centavos: 12000 }),
      installments: 2,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    }))

    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      id: 'g2',
      faturaId: 'f2',
      descricao: 'Atualizado',
      valorTotal: expect.objectContaining({ centavos: 12000 }),
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    }))
  })

  it('deve recriar as parcelas (excluir e relancar) quando o total de parcelas ou metodo muda', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Original 1/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 2,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    const g2 = new Gasto({
      id: 'g2',
      faturaId: 'f2',
      descricao: 'Original 2/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])
    
    mockFaturaRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'f1') return { id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }
      if (id === 'f2') return { id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }
      return null
    })
    mockFaturaRepo.listarTodas.mockResolvedValue([
      { id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' },
      { id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }
    ])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)

    await service.atualizarGastoCompleto('g1', {
      descricao: 'Atualizado para 3x',
      valorTotal: Dinheiro.deReais(150),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(7500)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(7500))],
      installments: 3
    })

    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g1')
    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g2')

    expect(mockGastoRepo.salvar).toHaveBeenCalledTimes(3)
  })

  it('deve excluir todos os gastos do grupo (em cascata) quando um gasto do grupo eh excluido', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Original 1/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 2,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    const g2 = new Gasto({
      id: 'g2',
      faturaId: 'f2',
      descricao: 'Original 2/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.excluirGasto('g1')

    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g1')
    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g2')
  })

  it('deve remover a associacao de conta fixa anulando o recurringBillId de gastos correspondentes', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const gastoComContaFixa = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Aluguel',
      valorTotal: Dinheiro.deReais(1500),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(1500))],
      recurringBillId: 'aluguel'
    })

    mockGastoRepo.listarTodos.mockResolvedValue([gastoComContaFixa])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.removerAssociacaoContaFixa('aluguel')

    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      id: 'g1',
      recurringBillId: null
    }))
  })
})

