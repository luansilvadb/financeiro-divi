import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageFaturaRepository } from './LocalStorageFaturaRepository'
import { Fatura } from '../../entities/Fatura'

describe('LocalStorageFaturaRepository', () => {
  let repo: LocalStorageFaturaRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageFaturaRepository()
  })

  it('deve salvar e buscar uma fatura por ID', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    await repo.salvar(fatura)
    const salvo = await repo.buscarPorId('f1')
    expect(salvo).not.toBeNull()
    expect(salvo!.status).toBe('ABERTA')
  })

  it('nao deve desduplicar faturas no listarTodas, mas deve desduplicar e migrar gastos no executarMigracoesEDesduplicacao', async () => {
    const faturasRaw = [
      { id: 'f_rem', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' },
      { id: 'f_mant', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }
    ]
    localStorage.setItem('divi_faturas', JSON.stringify(faturasRaw))

    const { LocalStorageGastoRepository } = await import('./LocalStorageGastoRepository')
    const { Gasto } = await import('../../entities/Gasto')
    const { Dinheiro } = await import('../../entities/Dinheiro')
    const { DivisaoDeGasto } = await import('../../entities/DivisaoDeGasto')
    
    const gastoRepo = new LocalStorageGastoRepository()
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f_mant',
      descricao: 'Teste Migracao',
      valorTotal: Dinheiro.deReais(10),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(10))]
    })
    await gastoRepo.salvar(gasto)

    const listarAntes = await repo.listarTodas()
    expect(listarAntes.length).toBe(2)

    await repo.executarMigracoesEDesduplicacao()

    const listarDepois = await repo.listarTodas()
    expect(listarDepois.length).toBe(1)
    
    expect(listarDepois[0].id).toBe('f_rem')
    
    const gastosAtualizados = await gastoRepo.listarTodos()
    expect(gastosAtualizados.length).toBe(1)
    expect(gastosAtualizados[0].faturaId).toBe('f_rem')
  })

  it('deve lancar erro grave e recusar salvar/listar se os dados locais de faturas estiverem corrompidos', async () => {
    localStorage.setItem('divi_faturas', '{invalid-json')
    await expect(repo.listarTodas()).rejects.toThrow('Banco de dados local de faturas corrompido')

    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    await expect(repo.salvar(fatura)).rejects.toThrow('Banco de dados local de faturas corrompido')
  })
})
