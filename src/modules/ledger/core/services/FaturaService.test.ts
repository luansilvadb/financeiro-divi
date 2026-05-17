import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../domain/Fatura'
import { Gasto } from '../domain/Gasto'
import { DivisaoDeGasto } from '../domain/DivisaoDeGasto'
import { Antecipacao } from '../domain/Antecipacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('FaturaService', () => {
  it('deve fechar a fatura sem gerar acertos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn() }
    const antRepo = { buscarPorFatura: vi.fn() }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    expect(acertoRepo.salvar).not.toHaveBeenCalled()
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
    const antecipacoes = [
      new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm2', valor: Dinheiro.deCentavos(3000), data: new Date() })
    ]

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue(gastos) }
    const antRepo = { buscarPorFatura: vi.fn().mockResolvedValue(antecipacoes) }
    const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
    await service.confirmarAcertos('f1')

    // m2 consumo=10000, ant=3000 -> deve pagar 7000
    // m3 consumo=10000, ant=0 -> deve pagar 10000
    // m1 (dono/responsavel) é excluído
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
    expect(acertoRepo.salvar).toHaveBeenCalledTimes(2)

    const acertosSalvos = acertoRepo.salvar.mock.calls.map(c => c[0])
    const acertoM2 = acertosSalvos.find(a => a.membroId === 'm2')
    const acertoM3 = acertosSalvos.find(a => a.membroId === 'm3')

    expect(acertoM2).toBeDefined()
    expect(acertoM2.valorAcerto.centavos).toBe(7000)
    expect(acertoM2.tipo).toBe('MEMBRO_PAGA')

    expect(acertoM3).toBeDefined()
    expect(acertoM3.valorAcerto.centavos).toBe(10000)
    expect(acertoM3.tipo).toBe('MEMBRO_PAGA')
  })

  it('deve reabrir a fatura e excluir os acertos persistidos', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date() })

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn() }
    const antRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn(), excluirPorFatura: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
    await service.reabrirFatura('f1')

    expect(fatura.status).toBe('ABERTA')
    expect(fatura.dataPagamentoBanco).toBeUndefined()
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
  })
})
