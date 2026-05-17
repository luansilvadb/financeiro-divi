import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../domain/Fatura'
import { Gasto } from '../domain/Gasto'
import { DivisaoDeGasto } from '../domain/DivisaoDeGasto'
import { Antecipacao } from '../domain/Antecipacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('FaturaService', () => {
  it('deve fechar a fatura e persistir AcertosMembro ignorando o responsavel', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const gastos = [
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: '', valorTotal: Dinheiro.deCentavos(200), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(100)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(100))] })
    ]
    const antecipacoes = [
      new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm2', valor: Dinheiro.deCentavos(50), data: new Date() })
    ]

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue(gastos), salvar: vi.fn() }
    const antRepo = { buscarPorFatura: vi.fn().mockResolvedValue(antecipacoes), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    // Apenas m2 deve ter acerto, pois m1 é o responsável
    expect(acertoRepo.salvar).toHaveBeenCalledTimes(1)
    const acertoSalvo = acertoRepo.salvar.mock.calls[0][0]
    expect(acertoSalvo.membroId).toBe('m2')
    expect(acertoSalvo.valorAcerto.centavos).toBe(50) // 100 consumo - 50 antecipado
    expect(acertoSalvo.tipo).toBe('MEMBRO_PAGA')
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
