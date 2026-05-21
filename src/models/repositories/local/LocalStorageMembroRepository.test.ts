import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageMembroRepository } from './LocalStorageMembroRepository'
import { Membro } from '../../entities/Membro'

describe('LocalStorageMembroRepository', () => {
  let repo: LocalStorageMembroRepository
  
  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageMembroRepository()
  })

  it('deve salvar e listar membros', async () => {
    const m = new Membro({ id: '1', nome: 'Luan' })
    await repo.salvar(m)
    const todos = await repo.listarTodos()
    expect(todos).toHaveLength(1)
    expect(todos[0].nome).toBe('Luan')
    expect(todos[0]).toBeInstanceOf(Membro)
  })

  it('deve buscar membro por id', async () => {
    const m = new Membro({ id: '1', nome: 'Luan' })
    await repo.salvar(m)
    
    const encontrado = await repo.buscarPorId('1')
    expect(encontrado).not.toBeNull()
    expect(encontrado?.nome).toBe('Luan')
    expect(encontrado).toBeInstanceOf(Membro)
  })

  it('deve retornar null se membro não existir', async () => {
    const encontrado = await repo.buscarPorId('999')
    expect(encontrado).toBeNull()
  })

  it('deve atualizar membro se já existir', async () => {
    const m1 = new Membro({ id: '1', nome: 'Luan' })
    await repo.salvar(m1)
    
    const m1v2 = new Membro({ id: '1', nome: 'Luan Editado' })
    await repo.salvar(m1v2)
    
    const todos = await repo.listarTodos()
    expect(todos).toHaveLength(1)
    expect(todos[0].nome).toBe('Luan Editado')
  })
})
