import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageCartaoRepository } from './LocalStorageCartaoRepository'
import { Cartao } from '../core/domain/Cartao'

describe('LocalStorageCartaoRepository', () => {
  let repo: LocalStorageCartaoRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageCartaoRepository()
  })

  it('deve salvar e buscar um cartao por ID', async () => {
    const cartao = new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })
    await repo.salvar(cartao)
    const salvo = await repo.buscarPorId('c1')
    expect(salvo).not.toBeNull()
    expect(salvo!.nome).toBe('Nubank')
  })

  it('deve excluir um cartao pelo id', async () => {
    const cartao = new Cartao({ id: 'c99', nome: 'Cartão Teste', diaFechamento: 5, responsavelPadraoId: 'm1' })
    await repo.salvar(cartao)
    
    let listados = await repo.listarTodos()
    expect(listados.some(c => c.id === 'c99')).toBe(true)

    await repo.excluir('c99')
    listados = await repo.listarTodos()
    expect(listados.some(c => c.id === 'c99')).toBe(false)
  })
})
