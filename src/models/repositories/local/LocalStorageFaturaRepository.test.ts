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

  it('deve assegurar obter ou criar faturas concorrentemente de forma atomica retornando mesmo ID', async () => {
    const repo = new LocalStorageFaturaRepository()
    
    // Executar chamadas concorrentes paralelas simulando abas
    const promises = Array.from({ length: 5 }).map(() => 
      repo.assegurarObterOuCriarFatura('cartao-race', 5, 2026, 'membro-a')
    )
    const resultados = await Promise.all(promises)
    
    const primeiroId = resultados[0].id
    resultados.forEach(f => {
      expect(f.id).toBe(primeiroId) // Todos devem apontar para a mesma fatura física
    })
  })

  it('deve excluir faturas abertas sem gastos associados por cartão', async () => {
    const f1 = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const f2 = new Fatura({ id: 'f2', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const f3 = new Fatura({ id: 'f3', cartaoId: 'c1', periodo: { mes: 7, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const f4 = new Fatura({ id: 'f4', cartaoId: 'c2', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    
    await repo.salvarMuitas([f1, f2, f3, f4])

    const { LocalStorageGastoRepository } = await import('./LocalStorageGastoRepository')
    const { Gasto } = await import('../../entities/Gasto')
    const { Dinheiro } = await import('../../entities/Dinheiro')
    const { DivisaoDeGasto } = await import('../../entities/DivisaoDeGasto')
    
    const gastoRepo = new LocalStorageGastoRepository()
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f2',
      descricao: 'Gasto Teste',
      valorTotal: Dinheiro.deReais(10),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(10))]
    })
    await gastoRepo.salvar(gasto)

    const repoComGasto = new LocalStorageFaturaRepository(gastoRepo)
    
    await repoComGasto.excluirFaturasAbertasSemGastosPorCartao('c1')

    const faturasRestantes = await repoComGasto.listarTodas()
    
    expect(faturasRestantes.find(f => f.id === 'f1')).toBeUndefined()
    expect(faturasRestantes.find(f => f.id === 'f2')).not.toBeUndefined()
    expect(faturasRestantes.find(f => f.id === 'f3')).not.toBeUndefined()
    expect(faturasRestantes.find(f => f.id === 'f4')).not.toBeUndefined()
  })
})
