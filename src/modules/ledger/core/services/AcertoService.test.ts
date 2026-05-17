import { describe, it, expect, vi } from 'vitest'
import { AcertoService } from './AcertoService'
import { AcertoMembro } from '../domain/AcertoMembro'
import { Fatura } from '../domain/Fatura'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('AcertoService', () => {
  it('deve marcar acerto como pago e transicionar fatura para ACERTADA se for o ultimo', async () => {
    const acerto1 = new AcertoMembro({ id: 'a1', faturaId: 'f1', membroId: 'm1', totalConsumido: Dinheiro.deCentavos(100), totalAntecipado: Dinheiro.deCentavos(0) })
    const acerto2 = new AcertoMembro({ id: 'a2', faturaId: 'f1', membroId: 'm2', totalConsumido: Dinheiro.deCentavos(100), totalAntecipado: Dinheiro.deCentavos(0), pago: true })
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })

    const acertoRepo = { 
      buscarPorId: vi.fn().mockResolvedValue(acerto1), 
      buscarPorFatura: vi.fn().mockResolvedValue([acerto1, acerto2]),
      salvar: vi.fn() 
    }
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }

    const service = new AcertoService(acertoRepo as any, faturaRepo as any)
    await service.marcarPago('a1', new Date())

    expect(acerto1.pago).toBe(true)
    expect(acertoRepo.salvar).toHaveBeenCalledWith(acerto1)
    expect(fatura.status).toBe('ACERTADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
  })
})
