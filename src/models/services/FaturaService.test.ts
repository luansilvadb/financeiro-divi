import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../entities/Fatura'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

describe('FaturaService', () => {
  it('deve fechar a fatura e gerar acertos para membros envolvidos nos gastos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto Simples',
          valorTotal: Dinheiro.deReais(100),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
          installments: 1
        }),
        new Gasto({
          id: 'g2',
          faturaId: 'f1',
          descricao: 'Parcela',
          valorTotal: Dinheiro.deReais(120),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(6000)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(6000))],
          installments: 2,
          totalInstallments: 3
        }),
        new Gasto({
          id: 'g3',
          faturaId: 'f1',
          descricao: 'Netting',
          valorTotal: Dinheiro.deReais(50),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(5000))],
          installments: 1,
          isSettlement: true
        })
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    // Fatura original é imutável, verificamos que salvar recebeu nova instância FECHADA
    expect(fatura.status).toBe('ABERTA') // original inalterada
    expect(faturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1', status: 'FECHADA' }))
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
    expect(acertoRepo.salvar).toHaveBeenCalledTimes(1)
    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: expect.objectContaining({ centavos: 12000 })
    }))
  })

  it('deve fechar a fatura com override de responsavelId', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await service.fecharFatura('f1', 'm2', new Date())

    // Fatura original imutável — verificamos nova instância
    expect(fatura.status).toBe('ABERTA') // original inalterada
    const faturaFechada = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaFechada.status).toBe('FECHADA')
    expect(faturaFechada.responsavelId).toBe('m2')
  })

  it('deve reabrir a fatura e excluir os acertos persistidos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn() }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await service.reabrirFatura('f1')

    // Fatura original imutável — verificamos nova instância
    expect(fatura.status).toBe('FECHADA') // original inalterada
    const faturaReaberta = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaReaberta.status).toBe('ABERTA')
    expect(faturaReaberta.dataPagamentoBanco).toBeUndefined()
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
  })

  it('deve assegurar faturas abertas para cartoes cadastrados', async () => {
    const faturasExistentes = [
      new Fatura({ id: 'f_existente', cartaoId: 'c_existente', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }),
      new Fatura({ id: 'f_pix_default', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    ]

    const faturaRepo = {
      buscarPorId: vi.fn(),
      listarTodas: vi.fn().mockResolvedValue(faturasExistentes),
      salvar: vi.fn()
    }

    const service = new FaturaService(faturaRepo as any, {} as any, {} as any)

    const cartoes = [
      { id: 'c_existente', responsavelPadraoId: 'm1' },
      { id: 'c_novo', responsavelPadraoId: 'm2' }
    ]

    const result = await service.assegurarFaturasAbertas(cartoes, 5, 2026)

    expect(faturaRepo.salvar).toHaveBeenCalledTimes(1)
    expect(faturaRepo.salvar.mock.calls[0][0].cartaoId).toBe('c_novo')
    expect(result.length).toBe(3)
  })

  it('deve criar fatura aberta para o mes atual mesmo se existir fatura aberta futura para o mesmo cartao', async () => {
    const faturasExistentes = [
      new Fatura({ id: 'f_futura', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }),
      new Fatura({ id: 'f_pix_default', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    ]

    const faturaRepo = {
      buscarPorId: vi.fn(),
      listarTodas: vi.fn().mockResolvedValue(faturasExistentes),
      salvar: vi.fn()
    }

    const service = new FaturaService(faturaRepo as any, {} as any, {} as any)
    const cartoes = [{ id: 'c1', responsavelPadraoId: 'm1' }]

    const result = await service.assegurarFaturasAbertas(cartoes, 5, 2026)

    expect(faturaRepo.salvar).toHaveBeenCalledTimes(1)
    expect(faturaRepo.salvar.mock.calls[0][0].cartaoId).toBe('c1')
    expect(faturaRepo.salvar.mock.calls[0][0].periodo).toEqual({ mes: 5, ano: 2026 })
    expect(result.length).toBe(3)
  })

  it('deve preservar historico de pagamentos (valorPago e pago) ao fechar novamente a fatura', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const acertoAntigo = {
      id: 'acerto_old_1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(100),
      tipo: 'MEMBRO_PAGA',
      valorPago: Dinheiro.deReais(40),
      pago: false,
      dataPagamento: undefined
    }

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([acertoAntigo]),
      excluirPorFatura: vi.fn(),
      salvar: vi.fn()
    }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto Simples',
          valorTotal: Dinheiro.deReais(100),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000))],
          installments: 1
        })
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      id: 'acerto_old_1', // deve reter o mesmo ID
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: expect.objectContaining({ centavos: 10000 }),
      valorPago: expect.objectContaining({ centavos: 4000 }), // preserva pagamento de R$ 40
      pago: false
    }))
  })

  it('deve reabrir pagamento preservado como pendente quando o valor recalculado aumenta', async () => {
    const dataPagamento = new Date('2026-05-20T10:00:00Z')
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const acertoAntigo = {
      id: 'acerto_old_1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(100),
      totalAntecipado: Dinheiro.deCentavos(0),
      tipo: 'MEMBRO_PAGA',
      valorPago: Dinheiro.deReais(100),
      pago: true,
      dataPagamento
    }

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([acertoAntigo]),
      excluirPorFatura: vi.fn(),
      salvar: vi.fn()
    }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto Recalculado',
          valorTotal: Dinheiro.deReais(120),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(12000))],
          installments: 1
        })
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      valorPago: expect.objectContaining({ centavos: 10000 }),
      valorAcerto: expect.objectContaining({ centavos: 12000 }),
      pago: false,
      dataPagamento: undefined
    }))
  })

  it('deve limitar pagamento preservado ao novo valor recalculado quando a direcao nao muda', async () => {
    const dataPagamento = new Date('2026-05-20T10:00:00Z')
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const acertoAntigo = {
      id: 'acerto_old_1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(80),
      totalAntecipado: Dinheiro.deCentavos(0),
      tipo: 'MEMBRO_PAGA',
      valorPago: Dinheiro.deReais(80),
      pago: true,
      dataPagamento
    }

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([acertoAntigo]),
      excluirPorFatura: vi.fn(),
      salvar: vi.fn()
    }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto Recalculado',
          valorTotal: Dinheiro.deReais(60),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(6000))],
          installments: 1
        })
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      valorPago: expect.objectContaining({ centavos: 6000 }),
      valorAcerto: expect.objectContaining({ centavos: 6000 }),
      pago: true,
      dataPagamento
    }))
  })

  it('deve zerar pagamento preservado quando o acerto recalculado muda de direcao', async () => {
    const dataPagamento = new Date('2026-05-20T10:00:00Z')
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const acertoAntigo = {
      id: 'acerto_old_1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(80),
      totalAntecipado: Dinheiro.deCentavos(0),
      tipo: 'MEMBRO_PAGA',
      valorPago: Dinheiro.deReais(80),
      pago: true,
      dataPagamento
    }

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([acertoAntigo]),
      excluirPorFatura: vi.fn(),
      salvar: vi.fn()
    }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto Recalculado',
          valorTotal: Dinheiro.deReais(60),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(6000))],
          installments: 1
        })
      ])
    }
    const antecipacaoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        { membroId: 'm2', valor: Dinheiro.deReais(100) }
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'RESPONSAVEL_PAGA',
      valorPago: expect.objectContaining({ centavos: 0 }),
      pago: false,
      dataPagamento: undefined
    }))
  })

  it('deve excluir o responsavel da fatura dos acertos contra si mesmo', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Mercado',
          valorTotal: Dinheiro.deReais(100),
          compradorId: 'm1',
          divisoes: [
            new DivisaoDeGasto('m1', Dinheiro.deReais(50)),
            new DivisaoDeGasto('m2', Dinheiro.deReais(50))
          ],
          method: 'card',
          cardOwner: 'm1'
        })
      ])
    }
    const antecipacaoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
    await service.fecharFatura('f1', 'm1', new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledTimes(1)
    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      membroId: 'm2',
      totalConsumido: expect.objectContaining({ centavos: 5000 }),
      valorAcerto: expect.objectContaining({ centavos: 5000 }),
      tipo: 'MEMBRO_PAGA'
    }))
  })

  it('deve abater antecipacoes no fechamento da fatura', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Mercado',
          valorTotal: Dinheiro.deReais(300),
          compradorId: 'm1',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(300))],
          method: 'card',
          cardOwner: 'm1'
        })
      ])
    }
    const antecipacaoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        { membroId: 'm2', valor: Dinheiro.deReais(100) }
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
    await service.fecharFatura('f1', 'm1', new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      membroId: 'm2',
      totalConsumido: expect.objectContaining({ centavos: 30000 }),
      totalAntecipado: expect.objectContaining({ centavos: 10000 }),
      valorAcerto: expect.objectContaining({ centavos: 20000 }),
      tipo: 'MEMBRO_PAGA'
    }))
  })

  it('deve gerar acerto para membro com apenas antecipacao', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }
    const antecipacaoRepo = {
      buscarPorFatura: vi.fn().mockResolvedValue([
        { membroId: 'm2', valor: Dinheiro.deReais(50) }
      ])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
    await service.fecharFatura('f1', 'm1', new Date())

    expect(acertoRepo.salvar).toHaveBeenCalledTimes(1)
    expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
      membroId: 'm2',
      totalConsumido: expect.objectContaining({ centavos: 0 }),
      totalAntecipado: expect.objectContaining({ centavos: 5000 }),
      valorAcerto: expect.objectContaining({ centavos: 5000 }),
      tipo: 'RESPONSAVEL_PAGA'
    }))
  })

  it('deve ser idempotente ao tentar fechar uma fatura que ja esta fechada ou acertada', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn() }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await expect(service.fecharFatura('f1')).resolves.not.toThrow()
    expect(faturaRepo.salvar).not.toHaveBeenCalled()
  })

  it('deve ser idempotente ao tentar reabrir uma fatura que ja esta aberta', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn() }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    await expect(service.reabrirFatura('f1')).resolves.not.toThrow()
    expect(faturaRepo.salvar).not.toHaveBeenCalled()
  })

  it('deve impedir a reabertura de uma fatura se houver netting confirmado no período seguinte', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ACERTADA' })
    const faturaPixProximo = new Fatura({ id: 'f-pix-proximo', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 6, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    
    const faturaRepo = {
      buscarPorId: vi.fn().mockResolvedValue(fatura),
      listarTodas: vi.fn().mockResolvedValue([fatura, faturaPixProximo]),
      salvar: vi.fn()
    }
    const acertoRepo = { buscarPorFatura: vi.fn(), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    
    const gastoNettingProximo = new Gasto({
      id: 'g-netting',
      faturaId: 'f-pix-proximo',
      descricao: 'Acerto Pix',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'm2',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))],
      isSettlement: true
    })
    const gastoRepo = {
      buscarPorFatura: vi.fn(),
      listarTodos: vi.fn().mockResolvedValue([gastoNettingProximo])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    
    await expect(service.reabrirFatura('f1')).rejects.toThrow(
      'Não é possível reabrir esta fatura pois já existem acertos de contas (Pix) confirmados no período seguinte. Estorne os acertos primeiro.'
    )
  })

  it('deve permitir a reabertura de uma fatura se não houver netting confirmado no período seguinte', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ACERTADA' })
    const faturaPixProximo = new Fatura({ id: 'f-pix-proximo', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 6, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    
    const faturaRepo = {
      buscarPorId: vi.fn().mockResolvedValue(fatura),
      listarTodas: vi.fn().mockResolvedValue([fatura, faturaPixProximo]),
      salvar: vi.fn()
    }
    const acertoRepo = { buscarPorFatura: vi.fn(), excluirPorFatura: vi.fn(), salvar: vi.fn() }
    
    const gastoNormalProximo = new Gasto({
      id: 'g-normal',
      faturaId: 'f-pix-proximo',
      descricao: 'Padaria',
      valorTotal: Dinheiro.deReais(10),
      compradorId: 'm2',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(10))]
    })
    const gastoRepo = {
      buscarPorFatura: vi.fn(),
      listarTodos: vi.fn().mockResolvedValue([gastoNormalProximo])
    }

    const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
    
    await expect(service.reabrirFatura('f1')).resolves.not.toThrow()
    // Fatura original imutável — verificamos nova instância
    expect(fatura.status).toBe('ACERTADA') // original inalterada
    const faturaReaberta = faturaRepo.salvar.mock.calls[0][0]
    expect(faturaReaberta.status).toBe('ABERTA')
  })
})
