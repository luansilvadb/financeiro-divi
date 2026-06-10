import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../entities/Fatura'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'

describe('FaturaService', () => {
  it('deve fechar a fatura', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaRepo: IFaturaRepository = {
      buscarPorId: vi.fn().mockResolvedValue(fatura),
      salvar: vi.fn(),
      buscarPorCartaoEPeriodo: vi.fn(),
      salvarMuitas: vi.fn(),
      listarTodas: vi.fn(),
      assegurarObterOuCriarFatura: vi.fn()
    }
    const service = new FaturaService(faturaRepo)
    
    await service.fecharFatura('f1', undefined, new Date())

    expect(faturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1', status: 'FECHADA' }))
  })

  it('deve fechar a fatura com override de responsavelId', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaRepo: IFaturaRepository = {
      buscarPorId: vi.fn().mockResolvedValue(fatura),
      salvar: vi.fn(),
      buscarPorCartaoEPeriodo: vi.fn(),
      salvarMuitas: vi.fn(),
      listarTodas: vi.fn(),
      assegurarObterOuCriarFatura: vi.fn()
    }
    const service = new FaturaService(faturaRepo)
    
    await service.fecharFatura('f1', 'm2', new Date())

    const faturaFechada = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaFechada.status).toBe('FECHADA')
    expect(faturaFechada.responsavelId).toBe('m2')
  })

  it('deve reabrir a fatura', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date() })
    const faturaRepo: IFaturaRepository = {
      buscarPorId: vi.fn().mockResolvedValue(fatura),
      salvar: vi.fn(),
      buscarPorCartaoEPeriodo: vi.fn(),
      salvarMuitas: vi.fn(),
      listarTodas: vi.fn(),
      assegurarObterOuCriarFatura: vi.fn()
    }
    const service = new FaturaService(faturaRepo)
    
    await service.reabrirFatura('f1')

    const faturaReaberta = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaReaberta.status).toBe('ABERTA')
    expect(faturaReaberta.dataPagamentoBanco).toBeUndefined()
  })

  it('deve assegurar faturas abertas para cartoes cadastrados', async () => {
    const faturasExistentes = [
      new Fatura({ id: 'f_existente', cartaoId: 'c_existente', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }),
      new Fatura({ id: 'f_pix_default', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    ]
    const faturaRepo: IFaturaRepository = {
      listarTodas: vi.fn().mockResolvedValue(faturasExistentes),
      salvarMuitas: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorCartaoEPeriodo: vi.fn(),
      salvar: vi.fn(),
      assegurarObterOuCriarFatura: vi.fn()
    }
    const service = new FaturaService(faturaRepo)

    const cartoes = [
      { id: 'c_existente', responsavelPadraoId: 'm1' },
      { id: 'c_novo', responsavelPadraoId: 'm2' }
    ]

    const result = await service.assegurarFaturasAbertas(cartoes, 5, 2026)

    expect(faturaRepo.salvarMuitas).toHaveBeenCalledTimes(1)
    expect(faturaRepo.salvarMuitas.mock.calls[0][0][0].cartaoId).toBe('c_novo')
    expect(result.length).toBe(3)
  })
})
