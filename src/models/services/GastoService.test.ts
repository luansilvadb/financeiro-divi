import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Cartao } from '../entities/Cartao'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import { Gasto } from '../entities/Gasto'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import { GastoService } from './GastoService'
import { LancamentoService } from './LancamentoService'

const divisao = new DivisaoDeGasto('m1', Dinheiro.deReais(100))
const cartao = new Cartao({ id: 'c1', nome: 'Cartao', diaFechamento: 5, responsavelPadraoId: 'm1' })
const fatura = (id: string, mes: number) => new Fatura({
  id,
  cartaoId: 'c1',
  periodo: { mes, ano: 2026 },
  responsavelId: 'm1',
  status: 'ABERTA'
})
const gasto = (props: Partial<ConstructorParameters<typeof Gasto>[0]> = {}) => new Gasto({
  id: 'g1',
  faturaId: 'f1',
  descricao: 'Original',
  valorTotal: Dinheiro.deReais(100),
  compradorId: 'm1',
  divisoes: [divisao],
  ...props
})

describe('GastoService.atualizarGastoCompleto', () => {
  let gastoRepo: IGastoRepository
  let faturaRepo: IFaturaRepository
  let cartaoRepo: ICartaoRepository
  let lancamentoService: LancamentoService
  let service: GastoService

  const dados = {
    descricao: 'Atualizado',
    valorTotal: Dinheiro.deReais(120),
    compradorId: 'm1',
    method: 'card' as const,
    cardOwner: 'c1',
    divisoes: [divisao],
    installments: 1
  }

  beforeEach(() => {
    gastoRepo = {
      buscarPorId: vi.fn(),
      salvar: vi.fn(),
      salvarMuitos: vi.fn(),
      excluir: vi.fn(),
      excluirMuitos: vi.fn(),
      listarTodos: vi.fn()
    }
    faturaRepo = {
      buscarPorId: vi.fn(),
      buscarPorCartaoEPeriodo: vi.fn(),
      salvar: vi.fn(),
      salvarMuitas: vi.fn(),
      listarTodas: vi.fn(),
      assegurarObterOuCriarFatura: vi.fn()
    }
    cartaoRepo = {
      buscarPorId: vi.fn(),
      salvar: vi.fn(),
      listarTodos: vi.fn().mockResolvedValue([cartao]),
      excluir: vi.fn()
    }
    lancamentoService = new LancamentoService(gastoRepo, faturaRepo, cartaoRepo)
    service = new GastoService(gastoRepo, faturaRepo, cartaoRepo, lancamentoService)
  })

  it('atualiza um gasto individual preservando seus metadados', async () => {
    const original = gasto({ recurringBillId: 'conta-1', isPrivate: true, splitMode: 'income' })
    vi.mocked(gastoRepo.buscarPorId).mockResolvedValue(original)
    vi.mocked(faturaRepo.buscarPorId).mockResolvedValue(fatura('f1', 6))
    vi.mocked(faturaRepo.assegurarObterOuCriarFatura).mockResolvedValue(fatura('f2', 6))

    await service.atualizarGastoCompleto(original.id, dados)

    const salvo = vi.mocked(gastoRepo.salvar).mock.calls[0][0]
    expect(salvo.faturaId).toBe('f2')
    expect(salvo.descricao).toBe('Atualizado')
    expect(salvo.recurringBillId).toBe('conta-1')
    expect(salvo.cardOwner).toBe('m1')
    expect(salvo.isPrivate).toBe(true)
    expect(salvo.splitMode).toBe('income')
  })

  it('recria um gasto individual quando ele passa a ser parcelado', async () => {
    const original = gasto()
    vi.mocked(gastoRepo.buscarPorId).mockResolvedValue(original)
    vi.mocked(faturaRepo.buscarPorId).mockResolvedValue(fatura('f1', 6))
    const relancar = vi.spyOn(lancamentoService, 'lancarGastoOuEmprestimo').mockResolvedValue()

    await service.atualizarGastoCompleto(original.id, { ...dados, installments: 3 })

    expect(gastoRepo.excluir).toHaveBeenCalledWith('g1')
    expect(relancar).toHaveBeenCalledWith(expect.objectContaining({ installments: 3, periodo: { mes: 6, ano: 2026 } }))
  })

  it('recria todo o grupo quando quantidade de parcelas muda', async () => {
    const primeira = gasto({ id: 'g1', installments: 3, totalInstallments: 3, grupoParcelasId: 'grupo-1' })
    const segunda = gasto({ id: 'g2', faturaId: 'f2', installments: 2, totalInstallments: 3, grupoParcelasId: 'grupo-1' })
    vi.mocked(gastoRepo.buscarPorId).mockResolvedValue(segunda)
    vi.mocked(gastoRepo.listarTodos).mockResolvedValue([primeira, segunda])
    vi.mocked(faturaRepo.buscarPorId).mockResolvedValue(fatura('f1', 6))
    const relancar = vi.spyOn(lancamentoService, 'lancarGastoOuEmprestimo').mockResolvedValue()

    await service.atualizarGastoCompleto(segunda.id, { ...dados, installments: 4 })

    expect(gastoRepo.excluirMuitos).toHaveBeenCalledWith(['g1', 'g2'])
    expect(relancar).toHaveBeenCalledWith(expect.objectContaining({ installments: 4, periodo: { mes: 6, ano: 2026 } }))
  })

  it('atualiza todas as parcelas sem recriar o grupo quando sua estrutura nao muda', async () => {
    const primeira = gasto({ id: 'g1', installments: 2, totalInstallments: 2, grupoParcelasId: 'grupo-1', method: 'card' })
    const segunda = gasto({ id: 'g2', faturaId: 'f2', installments: 1, totalInstallments: 2, grupoParcelasId: 'grupo-1', method: 'card' })
    vi.mocked(gastoRepo.buscarPorId).mockResolvedValue(primeira)
    vi.mocked(gastoRepo.listarTodos).mockResolvedValue([primeira, segunda])
    vi.mocked(faturaRepo.buscarPorId).mockImplementation(async id => id === 'f1' ? fatura('f1', 6) : fatura('f2', 7))
    vi.mocked(faturaRepo.listarTodas).mockResolvedValue([fatura('c1-6', 6), fatura('c1-7', 7)])

    await service.atualizarGastoCompleto(primeira.id, { ...dados, installments: 2 })

    const salvos = vi.mocked(gastoRepo.salvarMuitos).mock.calls[0][0]
    expect(salvos).toHaveLength(2)
    expect(salvos.map(item => item.installments)).toEqual([2, 1])
    expect(gastoRepo.excluirMuitos).not.toHaveBeenCalled()
  })
})
