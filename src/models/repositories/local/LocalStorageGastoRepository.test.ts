import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageGastoRepository } from './LocalStorageGastoRepository'
import { Gasto } from '../../entities/Gasto'
import { Dinheiro } from '../../entities/Dinheiro'
import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'

describe('LocalStorageGastoRepository', () => {
  let repo: LocalStorageGastoRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageGastoRepository()
  })

  it('deve salvar e buscar um gasto gravando compradorId', async () => {
    const total = Dinheiro.deCentavos(5000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000))]
    const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Carrefour', valorTotal: total, compradorId: 'm1', divisoes })

    await repo.salvar(gasto)
    const list = await repo.buscarPorFatura('f1')

    expect(list.length).toBe(1)
    expect(list[0].compradorId).toBe('m1')
  })

  it('deve tolerar gastos legados sem compradorId e inferir com base no primeiro membro da divisao', async () => {
    // Grava diretamente dado legado no localStorage
    const legado = [{
      id: 'g_legacy',
      faturaId: 'f_legacy',
      descricao: 'Legacy',
      valorTotalCentavos: 3000,
      divisoes: [{ membroId: 'm_legacy', centavos: 3000 }]
    }]
    localStorage.setItem('divi_gastos_cartao', JSON.stringify(legado))

    const list = await repo.buscarPorFatura('f_legacy')
    expect(list.length).toBe(1)
    expect(list[0].compradorId).toBe('m_legacy')
  })

  it('deve salvar e carregar gastos contendo dados de parcelamento e empréstimos', async () => {
    const repo = new LocalStorageGastoRepository()
    const divisoes = [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'gasto_loan_1',
      faturaId: 'f1',
      descricao: 'Empréstimo da Luz',
      valorTotal: Dinheiro.deCentavos(10000),
      compradorId: 'm1',
      divisoes,
      installments: 2,
      isLoan: true,
      borrowerId: 'm2'
    })

    await repo.salvar(gasto)
    const porFatura = await repo.buscarPorFatura('f1')
    const recuperado = porFatura.find(g => g.id === 'gasto_loan_1')

    expect(recuperado).toBeDefined()
    expect(recuperado!.installments).toBe(2)
    expect(recuperado!.isLoan).toBe(true)
    expect(recuperado!.borrowerId).toBe('m2')
  })
})
