import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../entities/Fatura'

describe('FaturaService', () => {
  it('deve fechar a fatura sem gerar acertos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    expect(acertoRepo.salvar).not.toHaveBeenCalled()
  })

  it('deve fechar a fatura com override de responsavelId', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', 'm2', new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(fatura.responsavelId).toBe('m2')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
  })

  it('deve reabrir a fatura e excluir os acertos persistidos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn() }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any)
    await service.reabrirFatura('f1')

    expect(fatura.status).toBe('ABERTA')
    expect(fatura.dataPagamentoBanco).toBeUndefined()
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
  })

  it('deve assegurar faturas abertas para cartoes cadastrados', async () => {
    const faturasExistentes = [
      new Fatura({ id: 'f_existente', cartaoId: 'c_existente', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    ]

    const faturaRepo = {
      buscarPorId: vi.fn(),
      listarTodas: vi.fn().mockResolvedValue(faturasExistentes),
      salvar: vi.fn()
    }

    const service = new FaturaService(faturaRepo as any, {} as any)

    const cartoes = [
      { id: 'c_existente', responsavelPadraoId: 'm1' },
      { id: 'c_novo', responsavelPadraoId: 'm2' }
    ]

    const result = await service.assegurarFaturasAbertas(cartoes, 5, 2026)

    // Deve criar apenas para o c_novo porque c_existente já tem fatura aberta no período
    expect(faturaRepo.salvar).toHaveBeenCalledTimes(1)
    expect(faturaRepo.salvar.mock.calls[0][0].cartaoId).toBe('c_novo')
    expect(result.length).toBe(2)
  })
})
