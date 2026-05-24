import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Gasto } from '../entities/Gasto'
import { Fatura } from '../entities/Fatura'

function criarMockFaturaRepo(faturasIniciais: Fatura[] = []) {
  const faturas = [...faturasIniciais]
  const repo = {
    buscarPorId: vi.fn(async (id: string) => faturas.find(f => f.id === id) || null),
    buscarPorCartaoEPeriodo: vi.fn(async (cartaoId: string, p: { mes: number; ano: number }) => faturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === p.mes && f.periodo.ano === p.ano) || null),
    salvar: vi.fn(async (f: Fatura) => {
      const idx = faturas.findIndex(item => item.id === f.id)
      if (idx >= 0) faturas[idx] = f
      else faturas.push(f)
    }),
    salvarMuitas: vi.fn(async (lista: Fatura[]) => {
      lista.forEach((f: Fatura) => {
        const idx = faturas.findIndex(item => item.id === f.id)
        if (idx >= 0) faturas[idx] = f
        else faturas.push(f)
      })
    }),
    listarTodas: vi.fn(async () => faturas),
    executarMigracoesEDesduplicacao: vi.fn(),
    assegurarObterOuCriarFatura: vi.fn(async (cartaoId, mes, ano, responsavelId) => {
      let fatura = faturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
      if (!fatura) {
        fatura = new Fatura({
          id: `mock-fatura-${cartaoId}-${mes}-${ano}`,
          cartaoId,
          periodo: { mes, ano },
          responsavelId,
          status: 'ABERTA'
        })
        faturas.push(fatura)
        await repo.salvar(fatura)
      }
      return fatura
    }),
    excluirFaturasAbertasSemGastosPorCartao: vi.fn(async () => {})
  }
  return repo
}

describe('GastoService', () => {
  it('deve lancar um gasto simples com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])
    mockFaturaRepo.listarTodas.mockResolvedValue([new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })])

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
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
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
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
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
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
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
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
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

    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledTimes(1)
    
    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: 'g1',
        faturaId: 'f1',
        descricao: 'Atualizado',
        valorTotal: expect.objectContaining({ centavos: 12000 }),
        installments: 2,
        totalInstallments: 2,
        grupoParcelasId: 'grupo-x'
      }),
      expect.objectContaining({
        id: 'g2',
        faturaId: 'f2',
        descricao: 'Atualizado',
        valorTotal: expect.objectContaining({ centavos: 12000 }),
        installments: 1,
        totalInstallments: 2,
        grupoParcelasId: 'grupo-x'
      })
    ]))
  })

  it('deve recriar as parcelas (excluir e relancar) quando o total de parcelas ou metodo muda', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
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
      if (id === 'f1') return new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
      if (id === 'f2') return new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
      return null
    })
    mockFaturaRepo.listarTodas.mockResolvedValue([
      new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }),
      new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
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

    expect(mockGastoRepo.excluirMuitos).toHaveBeenCalledWith(['g1', 'g2'])

    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledTimes(1)
  })

  it('deve impedir exclusão da parcela mãe se existirem parcelas subsequentes ativas', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Original 1/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
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
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    mockGastoRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'g1') return g1
      if (id === 'g2') return g2
      return null
    })
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    
    await expect(service.excluirGasto('g1')).rejects.toThrow(
      'Não é possível excluir esta parcela pois existem parcelas subsequentes ativas. Exclua as parcelas futuras deste gasto primeiro.'
    )
  })

  it('deve remover a associacao de conta fixa anulando o recurringBillId de gastos correspondentes', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
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

  it('deve lancar erro ao tentar lancar um gasto em fatura fechada ou acertada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const mockFaturaRepo = criarMockFaturaRepo([faturaFechada])
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    
    await expect(service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'card',
      compradorId: 'm1',
      valor: 100,
      descricao: 'Almoço',
      divisoes: [{ membroId: 'm1', valor: Dinheiro.deReais(100) }],
      installments: 1,
      cardOwnerId: 'c1',
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })).rejects.toThrow('Fatura não está ABERTA')
  })

  it('deve lancar erro ao tentar excluir um gasto simples em fatura fechada ou acertada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Gasto', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))] })
    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })

    mockGastoRepo.buscarPorId.mockResolvedValue(gasto)
    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaFechada)

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    
    await expect(service.excluirGasto('g1')).rejects.toThrow('Fatura não está ABERTA')
  })

  it('deve permitir a exclusão individual de uma parcela se ela for a última e bloquear se a fatura estiver fechada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'P1', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 2, totalInstallments: 2 })
    const g2 = new Gasto({ id: 'g2', faturaId: 'f2', descricao: 'P2', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 1, totalInstallments: 2 })

    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const faturaAberta = new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    mockGastoRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'g1') return g1
      if (id === 'g2') return g2
      return null
    })
    
    mockFaturaRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'f1') return faturaFechada
      if (id === 'f2') return faturaAberta
      return null
    })

    // 1. Excluir g2 (a última, aberta) -> deve ser permitido individualmente
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.excluirGasto('g2')
    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g2')

    // 2. Tentar excluir g1 (agora sem g2 na lista) -> deve ser bloqueado porque a fatura está FECHADA
    mockGastoRepo.listarTodos.mockResolvedValue([g1])
    await expect(service.excluirGasto('g1')).rejects.toThrow('Fatura não está ABERTA')
  })

  it('deve lancar erro ao tentar atualizar gasto simples em fatura fechada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Gasto', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))] })
    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })

    mockGastoRepo.buscarPorId.mockResolvedValue(gasto)
    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaFechada)

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)

    await expect(service.atualizarGastoCompleto('g1', {
      descricao: 'Novo',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      method: 'pix',
      cardOwner: null,
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      installments: 1
    })).rejects.toThrow('Fatura não está ABERTA')
  })

  it('deve lancar erro ao tentar alterar parcelamento de grupo com parcelas em faturas fechadas', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'P1', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 2, totalInstallments: 2 })
    const g2 = new Gasto({ id: 'g2', faturaId: 'f2', descricao: 'P2', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 1, totalInstallments: 2 })

    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const faturaAberta = new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    
    mockFaturaRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'f1') return faturaFechada
      if (id === 'f2') return faturaAberta
      return null
    })

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)

    await expect(service.atualizarGastoCompleto('g1', {
      descricao: 'P1 Alterado',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      installments: 3
    })).rejects.toThrow('Não é possível alterar o valor, parcelamento, comprador ou divisões de um gasto que possui parcelas em faturas fechadas')
  })

  it('deve atualizar apenas parcelas em faturas abertas de um grupo de parcelas', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'P1', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 2, totalInstallments: 2, method: 'card', cardOwner: 'm1' })
    const g2 = new Gasto({ id: 'g2', faturaId: 'f2', descricao: 'P2', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 1, totalInstallments: 2, method: 'card', cardOwner: 'm1' })

    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const faturaAberta = new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])

    mockFaturaRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'f1') return faturaFechada
      if (id === 'f2') return faturaAberta
      return null
    })
    mockFaturaRepo.listarTodas.mockResolvedValue([faturaFechada, faturaAberta])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)

    await service.atualizarGastoCompleto('g1', {
      descricao: 'Atualizado',
      valorTotal: Dinheiro.deReais(50), // mantemos o valor para permitir edição apenas cosmética
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], // mantemos a divisão
      installments: 2
    })

    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledTimes(1)
    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: 'g2',
        descricao: 'Atualizado'
      })
    ]))
  })

  it('deve lancar erro ao tentar alterar valor ou rateio de grupo de parcelas com alguma fechada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'P1', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 2, totalInstallments: 2, method: 'card', cardOwner: 'm1' })
    const g2 = new Gasto({ id: 'g2', faturaId: 'f2', descricao: 'P2', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 1, totalInstallments: 2, method: 'card', cardOwner: 'm1' })

    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const faturaAberta = new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])

    mockFaturaRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'f1') return faturaFechada
      if (id === 'f2') return faturaAberta
      return null
    })

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)

    await expect(service.atualizarGastoCompleto('g1', {
      descricao: 'Atualizado',
      valorTotal: Dinheiro.deReais(100), // Alterou o valor
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      installments: 2
    })).rejects.toThrow('Não é possível alterar o valor, parcelamento, comprador ou divisões de um gasto que possui parcelas em faturas fechadas')
  })

  it('deve reconciliar e dar baixa em acertos de membros pendentes do periodo anterior ao registrar netting', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }
    const mockAcertoRepo = { buscarPorId: vi.fn(), buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn(), listarTodos: vi.fn() }

    const faturaAtual = new Fatura({ id: 'f-fevereiro', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 2, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const faturaAnterior = new Fatura({ id: 'f-janeiro', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 1, ano: 2026 }, responsavelId: 'membro-credor', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const { AcertoMembro } = await import('../entities/AcertoMembro')
    const acertoPendente = new AcertoMembro({
      id: 'a-janeiro',
      faturaId: 'f-janeiro',
      membroId: 'membro-devedor',
      totalConsumido: Dinheiro.deCentavos(5000)
    })

    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaAtual)
    mockFaturaRepo.listarTodas.mockResolvedValue([faturaAtual, faturaAnterior])
    mockAcertoRepo.buscarPorFatura.mockResolvedValue([acertoPendente])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any, undefined, mockAcertoRepo as any)
    
    await service.registrarAcertoNetting({
      faturaId: 'f-fevereiro',
      descricao: 'Acerto de Saldo',
      valor: 50,
      fromMemberId: 'membro-devedor',
      toMemberId: 'membro-credor',
      method: 'pix'
    })

    expect(mockAcertoRepo.salvar).toHaveBeenCalled()
    expect(acertoPendente.pago).toBe(true)
    expect(faturaAnterior.status).toBe('ACERTADA')
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(faturaAnterior)
  })

  it('deve assegurar que chamadas concorrentes simultaneas para obterOuCriarFatura nao dupliquem a fatura', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'luan' }])
    
    // Simula concorrência assíncrona sob semáforo/lock no mock do repositório
    let faturasMock: any[] = []
    let executandoLock = false
    mockFaturaRepo.assegurarObterOuCriarFatura.mockImplementation(async (cartaoId, mes, ano, responsavelId) => {
      while (executandoLock) {
        await new Promise(resolve => setTimeout(resolve, 5))
      }
      executandoLock = true
      try {
        await new Promise(resolve => setTimeout(resolve, 30)) // simula leitura de IO
        let fatura = faturasMock.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
        if (!fatura) {
          fatura = new Fatura({
            id: crypto.randomUUID(),
            cartaoId,
            periodo: { mes, ano },
            responsavelId,
            status: 'ABERTA'
          })
          faturasMock.push(fatura)
        }
        return fatura
      } finally {
        executandoLock = false
      }
    })

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    const dados1 = {
      flow: 'expense' as const,
      paymentMethod: 'card' as const,
      compradorId: 'luan',
      valor: 100,
      descricao: 'Gasto 1',
      divisoes: [{ membroId: 'luan', valor: Dinheiro.deReais(100) }],
      installments: 1,
      cardOwnerId: 'c1',
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    }
    const dados2 = { ...dados1, descricao: 'Gasto 2', valor: 200, divisoes: [{ membroId: 'luan', valor: Dinheiro.deReais(200) }] }

    // Roda em paralelo concorrentemente
    await Promise.all([
      service.lancarGastoOuEmprestimo(dados1),
      service.lancarGastoOuEmprestimo(dados2)
    ])

    // Deve ter chamado mockFaturaRepo.assegurarObterOuCriarFatura duas vezes concorrentemente
    expect(mockFaturaRepo.assegurarObterOuCriarFatura).toHaveBeenCalledTimes(2)
    // Mas devido à atomicidade física local simulada do mock, o array físico faturasMock deve conter apenas UMA fatura única
    expect(faturasMock.length).toBe(1)
  })

  it('deve impedir exclusão de gasto comum se houver transações de acertos de netting no mesmo período', async () => {
    const mockGastoRepo = {
      salvar: vi.fn(),
      salvarMuitos: vi.fn(),
      buscarPorFatura: vi.fn(),
      excluir: vi.fn(),
      excluirMuitos: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn()
    }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const faturaPix = new Fatura({ id: 'fatura-pix-id', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const gastoNormal = new Gasto({ id: 'g-normal', faturaId: 'fatura-pix-id', descricao: 'Aluguel', compradorId: 'm1', valorTotal: Dinheiro.deReais(100), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))] })
    const gastoNetting = new Gasto({ id: 'g-netting', faturaId: 'fatura-pix-id', descricao: 'Acerto de Contas', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(50))], isSettlement: true })

    mockGastoRepo.buscarPorId.mockResolvedValue(gastoNormal)
    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaPix)
    mockFaturaRepo.listarTodas.mockResolvedValue([faturaPix])
    mockGastoRepo.listarTodos.mockResolvedValue([gastoNormal, gastoNetting])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    
    await expect(service.excluirGasto('g-normal')).rejects.toThrow(
      'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
    )
  })

  it('deve impedir atualização de gasto comum se houver transações de acertos de netting no mesmo período', async () => {
    const mockGastoRepo = {
      salvar: vi.fn(),
      salvarMuitos: vi.fn(),
      buscarPorFatura: vi.fn(),
      excluir: vi.fn(),
      excluirMuitos: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn()
    }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const faturaPix = new Fatura({ id: 'fatura-pix-id', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const gastoNormal = new Gasto({ id: 'g-normal', faturaId: 'fatura-pix-id', descricao: 'Aluguel antigo', compradorId: 'm1', valorTotal: Dinheiro.deReais(100), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))] })
    const gastoNetting = new Gasto({ id: 'g-netting', faturaId: 'fatura-pix-id', descricao: 'Acerto de Contas', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(50))], isSettlement: true })

    mockGastoRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'g-normal') return gastoNormal
      return null
    })
    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaPix)
    mockFaturaRepo.listarTodas.mockResolvedValue([faturaPix])
    mockGastoRepo.listarTodos.mockResolvedValue([gastoNormal, gastoNetting])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    
    await expect(service.atualizarGastoCompleto('g-normal', {
      descricao: 'Aluguel novo',
      valorTotal: Dinheiro.deReais(120),
      compradorId: 'm1',
      method: 'pix',
      cardOwner: null,
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(120))],
      installments: 1
    })).rejects.toThrow(
      'Não é possível alterar gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
    )
  })

  it('deve lançar erro se tentar lançar gasto envolvendo morador inativo ou inexistente', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }
    
    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])
    mockFaturaRepo.listarTodas.mockResolvedValue([new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })])

    const mockMembroRepo = {
      buscarPorId: vi.fn(async (id: string) => {
        if (id === 'inativo') {
          return { id, nome: 'Inativo', ativo: false }
        }
        if (id === 'ativo') {
          return { id, nome: 'Ativo', ativo: true }
        }
        return null
      }),
      listarTodos: vi.fn(),
      salvar: vi.fn()
    }

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo, mockMembroRepo as any)

    await expect(service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'pix',
      compradorId: 'inativo',
      valor: 100,
      descricao: 'Mercado',
      divisoes: [new DivisaoDeGasto('ativo', Dinheiro.deReais(100))],
      installments: 1,
      cardOwnerId: null,
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })).rejects.toThrow('Não é possível associar gastos a moradores inativos ou inexistentes.')

    await expect(service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'pix',
      compradorId: 'ativo',
      valor: 100,
      descricao: 'Mercado',
      divisoes: [new DivisaoDeGasto('inexistente', Dinheiro.deReais(100))],
      installments: 1,
      cardOwnerId: null,
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })).rejects.toThrow('Não é possível associar gastos a moradores inativos ou inexistentes.')
  })

  it('deve impedir a exclusão de um gasto comum se houver acerto de netting confirmado no mesmo período', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    mockFaturaRepo.buscarPorId.mockResolvedValue(fatura)

    const gastoComum = new Gasto({
      id: 'g-comum',
      faturaId: 'f1',
      descricao: 'Aluguel',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))]
    })

    const gastoNetting = new Gasto({
      id: 'g-netting',
      faturaId: 'f1',
      descricao: 'Acerto Pix',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'm2',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))],
      isSettlement: true
    })

    mockGastoRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'g-comum') return gastoComum
      if (id === 'g-netting') return gastoNetting
      return null
    })

    mockGastoRepo.listarTodos.mockResolvedValue([gastoComum, gastoNetting])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    await expect(service.excluirGasto('g-comum')).rejects.toThrow(
      'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
    )

    await expect(service.excluirGasto('g-netting')).resolves.not.toThrow()
  })

  it('deve impedir a edição de um gasto comum se houver acerto de netting confirmado no mesmo período', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    mockFaturaRepo.buscarPorId.mockResolvedValue(fatura)

    const gastoComum = new Gasto({
      id: 'g-comum',
      faturaId: 'f1',
      descricao: 'Aluguel',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))]
    })

    const gastoNetting = new Gasto({
      id: 'g-netting',
      faturaId: 'f1',
      descricao: 'Acerto Pix',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'm2',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))],
      isSettlement: true
    })

    mockGastoRepo.buscarPorId.mockImplementation(async (id) => {
      if (id === 'g-comum') return gastoComum
      return null
    })

    mockGastoRepo.listarTodos.mockResolvedValue([gastoComum, gastoNetting])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    await expect(service.atualizarGastoCompleto('g-comum', {
      descricao: 'Aluguel editado',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      method: 'pix',
      cardOwner: null,
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      installments: 1
    })).rejects.toThrow(
      'Não é possível alterar gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
    )
  })

  it('deve impedir a edição de um gasto parcelado a partir de uma parcela filha', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const gastoFilha = new Gasto({
      id: 'g-filha',
      faturaId: 'f2',
      descricao: 'Original 2/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })
    mockGastoRepo.buscarPorId.mockResolvedValue(gastoFilha)

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    await expect(service.atualizarGastoCompleto('g-filha', {
      descricao: 'Editado',
      valorTotal: Dinheiro.deReais(120),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(120))],
      installments: 2
    })).rejects.toThrow(
      'Este lançamento faz parte de um parcelamento. Para editá-lo, acesse a primeira parcela no período de origem do gasto.'
    )
  })

  it('deve impedir a exclusão de uma parcela se houver parcelas subsequentes ativas no grupo', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'P1', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 2, totalInstallments: 2 })
    const g2 = new Gasto({ id: 'g2', faturaId: 'f2', descricao: 'P2', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 1, totalInstallments: 2 })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await expect(service.excluirGasto('g1')).rejects.toThrow(
      'Não é possível excluir esta parcela pois existem parcelas subsequentes ativas. Exclua as parcelas futuras deste gasto primeiro.'
    )
  })

  it('deve permitir a exclusão individual de uma parcela se ela for a última ativa no grupo', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'P1', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 2, totalInstallments: 2 })
    const g2 = new Gasto({ id: 'g2', faturaId: 'f2', descricao: 'P2', compradorId: 'm1', valorTotal: Dinheiro.deReais(50), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))], grupoParcelasId: 'grupo-x', installments: 1, totalInstallments: 2 })

    mockGastoRepo.buscarPorId.mockResolvedValue(g2)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.excluirGasto('g2')
    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g2')
  })

  it('deve permitir a exclusão individual de acertos netting e não deve apagar outros acertos do período', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const faturaPix = new Fatura({ id: 'f-pix', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const gNetting1 = new Gasto({
      id: 'g-netting-1',
      faturaId: 'f-pix',
      descricao: 'Acerto 1',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(50))],
      isSettlement: true
    })
    const gNetting2 = new Gasto({
      id: 'g-netting-2',
      faturaId: 'f-pix',
      descricao: 'Acerto 2',
      valorTotal: Dinheiro.deReais(30),
      compradorId: 'm3',
      divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(30))],
      isSettlement: true
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(gNetting1)
    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaPix)
    mockGastoRepo.listarTodos.mockResolvedValue([gNetting1, gNetting2])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    await service.excluirGasto('g-netting-1')

    // Deve ter excluído apenas o g-netting-1
    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g-netting-1')
    // Não deve ter chamado excluirMuitos para limpar os outros acertos
    expect(mockGastoRepo.excluirMuitos).not.toHaveBeenCalled()
  })

  it('deve estornar a baixa de acertos pendentes da fatura anterior e alterar o status dela para FECHADA ao excluir acerto netting', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }
    const mockAcertoRepo = { buscarPorId: vi.fn(), buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn(), listarTodos: vi.fn() }

    const faturaAtual = new Fatura({ id: 'f-atual', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 6, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const faturaAnterior = new Fatura({ id: 'f-anterior', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm2', status: 'ACERTADA', dataPagamentoBanco: new Date() })

    const gNetting = new Gasto({
      id: 'g-netting',
      faturaId: 'f-atual',
      descricao: 'Acerto Pix',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(50))],
      isSettlement: true
    })

    const { AcertoMembro } = await import('../entities/AcertoMembro')
    const acertoMembroAnterior = new AcertoMembro({
      id: 'am-anterior',
      faturaId: 'f-anterior',
      membroId: 'm1',
      totalConsumido: Dinheiro.deReais(50),
      valorPago: Dinheiro.deReais(50),
      pago: true
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(gNetting)
    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaAtual)
    mockFaturaRepo.listarTodas.mockResolvedValue([faturaAtual, faturaAnterior])
    mockAcertoRepo.buscarPorFatura.mockResolvedValue([acertoMembroAnterior])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any, undefined, mockAcertoRepo as any)
    await service.excluirGasto('g-netting')

    // Deve estornar o valor pago no AcertoMembro
    expect(acertoMembroAnterior.valorPago.centavos).toBe(0)
    expect(acertoMembroAnterior.pago).toBe(false)
    expect(mockAcertoRepo.salvar).toHaveBeenCalledWith(acertoMembroAnterior)

    // A fatura anterior deve voltar a ser FECHADA
    expect(faturaAnterior.status).toBe('FECHADA')
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(faturaAnterior)

    // Deve ter excluído o gasto
    expect(mockGastoRepo.excluir).toHaveBeenCalledWith('g-netting')
  })
})



