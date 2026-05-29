import { describe, it, expect, vi } from 'vitest'
import { AcertoService } from './AcertoService'
import { AcertoMembro } from '../entities/AcertoMembro'
import { Fatura } from '../entities/Fatura'
import { Dinheiro } from '../entities/Dinheiro'

describe('AcertoService', () => {
  it('deve marcar acerto como pago e transicionar fatura para ACERTADA se for o ultimo', async () => {
    const acerto1 = new AcertoMembro({ id: 'a1', faturaId: 'f1', membroId: 'm1', totalConsumido: Dinheiro.deCentavos(100) })
    const acerto2 = new AcertoMembro({ id: 'a2', faturaId: 'f1', membroId: 'm2', totalConsumido: Dinheiro.deCentavos(100), pago: true })
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
    // Fatura original imutável — verificamos nova instância passada ao salvar
    expect(fatura.status).toBe('FECHADA') // original inalterada
    const faturaAcertada = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaAcertada.status).toBe('ACERTADA')
  })

  it('deve registrar reembolso parcial e marcar fatura acertada quando zerar a divida', async () => {
    const acerto = new AcertoMembro({
      id: 'ac1',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000)
    }) // valorAcerto = 10000
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
    expect(fatura.status).toBe('FECHADA') // original inalterada neste ponto

    // Quita restante
    await service.registrarReembolsoMembro('ac1', Dinheiro.deCentavos(5000))
    expect(acerto.pago).toBe(true)
    // Fatura original imutável — verificamos nova instância
    expect(fatura.status).toBe('FECHADA') // original permanece FECHADA
    const faturaAcertada = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaAcertada.status).toBe('ACERTADA')
  })

  it('deve manter fatura como FECHADA se acertos forem quitados mas pagamento ao banco estiver pendente', async () => {
    const acerto = new AcertoMembro({ id: 'ac1', faturaId: 'f1', membroId: 'm1', totalConsumido: Dinheiro.deCentavos(5000) })
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

  it('deve sincronizar com carryovers na fatura do periodo seguinte e reduzi-los ou exclui-los', async () => {
    const acerto = new AcertoMembro({
      id: 'a-antigo',
      faturaId: 'f-antiga',
      membroId: 'membro-devedor',
      totalConsumido: Dinheiro.deCentavos(5000)
    })
    
    const faturaAntiga = new Fatura({
      id: 'f-antiga',
      cartaoId: 'PIX_DEFAULT_ID',
      periodo: { mes: 5, ano: 2026 },
      responsavelId: 'membro-credor',
      status: 'FECHADA'
    })

    const faturaPixProx = new Fatura({
      id: 'f-nova-pix',
      cartaoId: 'PIX_DEFAULT_ID',
      periodo: { mes: 6, ano: 2026 },
      responsavelId: 'PIX_SYSTEM_OWNER',
      status: 'ABERTA'
    })

    const { Gasto } = await import('../entities/Gasto')
    const { DivisaoDeGasto } = await import('../entities/DivisaoDeGasto')

    const carryoverGasto = new Gasto({
      id: 'carry-1',
      faturaId: 'f-nova-pix',
      descricao: 'Saldo Inicial Pendente (Maio)',
      valorTotal: Dinheiro.deCentavos(5000),
      compradorId: 'membro-credor',
      divisoes: [new DivisaoDeGasto('membro-devedor', Dinheiro.deCentavos(5000))],
      isSettlement: true,
      installments: 1
    })

    const acertoRepo = {
      buscarPorId: vi.fn().mockResolvedValue(acerto),
      buscarPorFatura: vi.fn().mockResolvedValue([acerto]),
      salvar: vi.fn()
    }
    const faturaRepo = {
      buscarPorId: vi.fn().mockImplementation(async (id) => {
        if (id === 'f-antiga') return faturaAntiga
        if (id === 'f-nova-pix') return faturaPixProx
        return null
      }),
      listarTodas: vi.fn().mockResolvedValue([faturaAntiga, faturaPixProx]),
      salvar: vi.fn()
    }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([carryoverGasto]),
      excluir: vi.fn(),
      salvar: vi.fn()
    }

    const service = new AcertoService(acertoRepo as any, faturaRepo as any, gastoRepo as any)
    
    // Quita parcialmente (abate carryover)
    await service.registrarReembolsoMembro('a-antigo', Dinheiro.deCentavos(3000))
    
    expect(gastoRepo.salvar).toHaveBeenCalled()
    const callArgs = gastoRepo.salvar.mock.calls[0][0] as any
    expect(callArgs.valorTotal.centavos).toBe(2000) // 5000 - 3000

    // Quita totalmente (deve excluir carryover)
    await service.registrarReembolsoMembro('a-antigo', Dinheiro.deCentavos(2000))
    expect(gastoRepo.excluir).toHaveBeenCalledWith('carry-1')
  })

  // GAP 4: cobrir fluxo RESPONSAVEL_PAGA — responsável deve dinheiro ao membro
  it('(GAP4) deve quitar acerto do tipo RESPONSAVEL_PAGA corretamente via marcarPago', async () => {
    // Cenário: membro antecipou R$100, consumiu R$0 — responsável deve devolver R$100 ao membro
    const acerto = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deCentavos(0),
      totalAntecipado: Dinheiro.deReais(100),
      tipo: 'RESPONSAVEL_PAGA',
      valorPago: Dinheiro.deCentavos(0),
      pago: false
    })

    expect(acerto.tipo).toBe('RESPONSAVEL_PAGA')
    expect(acerto.valorAcerto.centavos).toBe(10000) // Math.abs(-10000) = 10000

    const fatura = new Fatura({
      id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 },
      responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date()
    })

    const acertoRepo = {
      buscarPorId: vi.fn().mockResolvedValue(acerto),
      salvar: vi.fn(),
      buscarPorFatura: vi.fn().mockResolvedValue([acerto])
    }
    const faturaRepo = {
      buscarPorId: vi.fn().mockResolvedValue(fatura),
      listarTodas: vi.fn().mockResolvedValue([]),
      salvar: vi.fn()
    }

    const service = new AcertoService(acertoRepo as any, faturaRepo as any)
    await service.marcarPago('a1', new Date())

    // O acerto deve estar marcado como pago
    expect(acerto.pago).toBe(true)
    // A fatura deve ter transitado para ACERTADA
    const faturaAcertada = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaAcertada.status).toBe('ACERTADA')
  })
})
