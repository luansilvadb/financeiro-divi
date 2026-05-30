import { describe, it, expect, vi } from 'vitest'
import { LancamentoService } from './LancamentoService'
import { Fatura } from '../entities/Fatura'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

function criarMockFaturaRepo(faturasIniciais: Fatura[] = []) {
  const faturas = [...faturasIniciais]
  const repo = {
    buscarPorId: vi.fn(async (id: string) => faturas.find(f => f.id === id) || null),
    buscarPorCartaoEPeriodo: vi.fn(async (cartaoId: string, p: { mes: number; ano: number }) => 
      faturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === p.mes && f.periodo.ano === p.ano) || null
    ),
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
      }
      return fatura
    })
  }
  return repo
}

describe('LancamentoService', () => {
  it('deve lancar um gasto simples à vista com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo([
      new Fatura({ id: 'f1', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    ])
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn().mockResolvedValue([]), excluir: vi.fn() }

    const service = new LancamentoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    await service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'pix',
      compradorId: 'm1',
      valor: 150.50,
      descricao: 'Supermercado',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(150.50))],
      installments: 1,
      cardOwnerId: null,
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      descricao: 'Supermercado',
      valorTotal: expect.objectContaining({ centavos: 15050 }),
      compradorId: 'm1',
      installments: 1
    }))
  })

  it('deve projetar gastos parcelados no cartao em multiplas faturas futuras abertas', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    
    const faturaAtiva = new Fatura({ id: 'f-c1-5-2026', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const mockFaturaRepo = criarMockFaturaRepo([faturaAtiva])
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn().mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }]), excluir: vi.fn() }

    const service = new LancamentoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    await service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'card',
      compradorId: 'm1',
      valor: 300,
      descricao: 'Compra Parcelada',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(300))],
      installments: 3,
      cardOwnerId: 'c1',
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })

    // Deve salvar os 3 gastos parcelados (o primeiro e as outras duas projeções)
    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledTimes(1)
    const gastosSalvos = mockGastoRepo.salvarMuitos.mock.calls[0][0] as Gasto[]
    expect(gastosSalvos.length).toBe(3)
    
    // As parcelas devem estar nos períodos 5/2026, 6/2026 e 7/2026
    expect(gastosSalvos[0].faturaId).toBe('f-c1-5-2026')
    expect(gastosSalvos[1].faturaId).toBe('c1-6-2026')
    expect(gastosSalvos[2].faturaId).toBe('c1-7-2026')

    // Deve criar e salvar as faturas futuras na memória
    expect(mockFaturaRepo.salvarMuitas).toHaveBeenCalledTimes(1)
    const faturasSalvas = mockFaturaRepo.salvarMuitas.mock.calls[0][0] as Fatura[]
    expect(faturasSalvas.length).toBe(2)
    expect(faturasSalvas[0].periodo).toEqual({ mes: 6, ano: 2026 })
    expect(faturasSalvas[1].periodo).toEqual({ mes: 7, ano: 2026 })
  })

  it('deve permitir lancamento se a fatura ativa (atual) do lancamento estiver fechada ou acertada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    
    const faturaFechada = new Fatura({ id: 'f-c1-5-2026', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const mockFaturaRepo = criarMockFaturaRepo([faturaFechada])
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn().mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }]), excluir: vi.fn() }

    const service = new LancamentoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    
    await expect(service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'card',
      compradorId: 'm1',
      valor: 100,
      descricao: 'Tentativa permitida',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))],
      installments: 1,
      cardOwnerId: 'c1',
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })).resolves.not.toThrow()
  })

  it('deve permitir lancamento se alguma fatura futura do parcelamento estiver fechada ou acertada', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    
    const faturaAtiva = new Fatura({ id: 'f-c1-5-2026', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaFuturaFechada = new Fatura({ id: 'c1-6-2026', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    
    const mockFaturaRepo = criarMockFaturaRepo([faturaAtiva, faturaFuturaFechada])
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn().mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }]), excluir: vi.fn() }

    const service = new LancamentoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)
    
    await expect(service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'card',
      compradorId: 'm1',
      valor: 300,
      descricao: 'Parcelamento permitido',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(300))],
      installments: 3,
      cardOwnerId: 'c1',
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })).resolves.not.toThrow()
  })
})
