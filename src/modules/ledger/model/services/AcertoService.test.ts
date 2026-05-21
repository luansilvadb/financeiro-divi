import { describe, it, expect, vi } from 'vitest'
import { AcertoService } from './AcertoService'
import { AcertoMembro } from '../domain/AcertoMembro'
import { Fatura } from '../domain/Fatura'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('AcertoService', () => {
  it('deve marcar acerto como pago e transicionar fatura para ACERTADA se for o ultimo', async () => {
    const acerto1 = new AcertoMembro({ id: 'a1', faturaId: 'f1', membroId: 'm1', totalConsumido: Dinheiro.deCentavos(100), totalAntecipado: Dinheiro.deCentavos(0) })
    const acerto2 = new AcertoMembro({ id: 'a2', faturaId: 'f1', membroId: 'm2', totalConsumido: Dinheiro.deCentavos(100), totalAntecipado: Dinheiro.deCentavos(0), pago: true })
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA', dataPagamentoBanco: new Date() })

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

  it('deve registrar reembolso parcial e marcar fatura acertada quando zerar a divida', async () => {
    const acerto = new AcertoMembro({
      id: 'ac1',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000),
      totalAntecipado: Dinheiro.deCentavos(2000)
    }) // valorAcerto = 8000
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm2', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const acertoRepo = {
      buscarPorId: vi.fn().mockResolvedValue(acerto),
      buscarPorFatura: vi.fn().mockResolvedValue([acerto]),
      salvar: vi.fn()
    }
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }

    const service = new AcertoService(acertoRepo as any, faturaRepo as any)

    // Amortiza parcial
    await service.registrarReembolsoMembro('ac1', Dinheiro.deCentavos(5000))
    expect(acerto.pago).toBe(false)
    expect(acerto.valorPago.centavos).toBe(5000)
    expect(fatura.status).toBe('FECHADA')

    // Quita restante
    await service.registrarReembolsoMembro('ac1', Dinheiro.deCentavos(3000))
    expect(acerto.pago).toBe(true)
    expect(fatura.status).toBe('ACERTADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
  })

  it('deve manter fatura como FECHADA se acertos forem quitados mas pagamento ao banco estiver pendente', async () => {
    const acerto = new AcertoMembro({ id: 'ac1', faturaId: 'f1', membroId: 'm1', totalConsumido: Dinheiro.deCentavos(5000), totalAntecipado: Dinheiro.deCentavos(0) })
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm2', status: 'FECHADA' }) // sem dataPagamentoBanco

    const acertoRepo = {
      buscarPorId: vi.fn().mockResolvedValue(acerto),
      buscarPorFatura: vi.fn().mockResolvedValue([acerto]),
      salvar: vi.fn()
    }
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }

    const service = new AcertoService(acertoRepo as any, faturaRepo as any)
    await service.registrarReembolsoMembro('ac1', Dinheiro.deCentavos(5000))

    expect(acerto.pago).toBe(true)
    expect(fatura.status).toBe('FECHADA') // Continua FECHADA pois banco não foi pago!
  })
})
