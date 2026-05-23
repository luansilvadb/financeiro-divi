import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Dinheiro } from '../entities/Dinheiro'
import { Fatura } from '../entities/Fatura'
import { AcertoMembro } from '../entities/AcertoMembro'

describe('GastoService F-04 Fix', () => {
  it('nao deve salvar a fatura novamente se ela ja estiver como ACERTADA no netting', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), salvarMuitas: vi.fn(), listarTodas: vi.fn(), executarMigracoesEDesduplicacao: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }
    const mockAcertoRepo = { buscarPorId: vi.fn(), buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn(), listarTodos: vi.fn() }

    const faturaAtual = new Fatura({ id: 'f-fevereiro', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 2, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const faturaAnterior = new Fatura({ id: 'f-janeiro', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 1, ano: 2026 }, responsavelId: 'membro-credor', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const acertoPendente = new AcertoMembro({
      id: 'a-janeiro',
      faturaId: 'f-janeiro',
      membroId: 'membro-devedor',
      totalConsumido: Dinheiro.deCentavos(5000)
    })

    mockFaturaRepo.buscarPorId.mockResolvedValue(faturaAtual)
    mockFaturaRepo.listarTodas.mockResolvedValue([faturaAtual, faturaAnterior])
    mockAcertoRepo.buscarPorFatura.mockResolvedValue([acertoPendente])

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any, mockAcertoRepo as any)
    
    await service.registrarAcertoNetting({
      faturaId: 'f-fevereiro',
      descricao: 'Acerto de Saldo',
      valor: 50,
      fromMemberId: 'membro-devedor',
      toMemberId: 'membro-credor',
      method: 'pix'
    })

    // Deve ter chamado registrarReembolso e salvo o acerto
    expect(mockAcertoRepo.salvar).toHaveBeenCalled()
    expect(acertoPendente.pago).toBe(true)
    
    // Deve ter salvo a faturaAnterior como ACERTADA
    expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: 'f-janeiro', status: 'ACERTADA' }))
  })
})
