import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../entities/Fatura'
import { Gasto } from '../entities/Gasto'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Dinheiro } from '../entities/Dinheiro'

describe('FaturaService', () => {
  it('deve fechar a fatura sem gerar acertos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn() }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', undefined, new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    expect(acertoRepo.salvar).not.toHaveBeenCalled()
  })

  it('deve fechar a fatura com override de responsavelId', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn() }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', 'm2', new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(fatura.responsavelId).toBe('m2')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
  })

  it('deve consolidar os gastos finais e gerar acertos ao confirmar acertos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const gastos = [
      new Gasto({
        id: 'g1',
        faturaId: 'f1',
        descricao: 'Mercado',
        valorTotal: Dinheiro.deCentavos(20000),
        compradorId: 'm2',
        divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000)), new DivisaoDeGasto('m3', Dinheiro.deCentavos(10000))]
      })
    ]

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue(gastos) }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, acertoRepo as any)
    await service.confirmarAcertos('f1')

    // m2 consumo=10000 -> deve pagar 10000
    // m3 consumo=10000 -> deve pagar 10000
    // m1 (dono/responsavel) é excluído
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
    expect(acertoRepo.salvar).toHaveBeenCalledTimes(2)

    const acertosSalvos = acertoRepo.salvar.mock.calls.map(c => c[0])
    const acertoM2 = acertosSalvos.find(a => a.membroId === 'm2')
    const acertoM3 = acertosSalvos.find(a => a.membroId === 'm3')

    expect(acertoM2).toBeDefined()
    expect(acertoM2.valorAcerto.centavos).toBe(10000)
    expect(acertoM2.tipo).toBe('MEMBRO_PAGA')

    expect(acertoM3).toBeDefined()
    expect(acertoM3.valorAcerto.centavos).toBe(10000)
    expect(acertoM3.tipo).toBe('MEMBRO_PAGA')
  })

  it('deve reabrir a fatura e excluir os acertos persistidos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, acertoRepo as any)
    await service.reabrirFatura('f1')

    expect(fatura.status).toBe('ABERTA')
    expect(fatura.dataPagamentoBanco).toBeUndefined()
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
  })

  it('deve registrar e remover o pagamento do banco e autotransicionar para ACERTADA se acertos estiverem pagos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const acertos = [{ id: 'a1', faturaId: 'f1', membroId: 'm2', valorAcerto: Dinheiro.deCentavos(5000), valorPago: Dinheiro.deCentavos(5000), pago: true }]

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue(acertos) }

    const service = new FaturaService(faturaRepo as any, {} as any, acertoRepo as any)
    
    // Registra pagamento banco
    await service.registrarPagamentoBanco('f1', new Date())

    expect(fatura.dataPagamentoBanco).toBeDefined()
    expect(fatura.status).toBe('ACERTADA')
    expect(faturaRepo.salvar).toHaveBeenCalled()

    // Remove pagamento banco
    await service.removerPagamentoBanco('f1')
    expect(fatura.dataPagamentoBanco).toBeUndefined()
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

    const service = new FaturaService(faturaRepo as any, {} as any, {} as any)

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
