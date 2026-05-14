import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryTransacaoRepository } from './MemoryTransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'

describe('MemoryTransacaoRepository', () => {
  let repository: MemoryTransacaoRepository

  beforeEach(() => {
    repository = new MemoryTransacaoRepository()
  })

  it('deve salvar e buscar uma transação por ID', async () => {
    const total = Dinheiro.deReais(100)
    const divisoes = [new Divisao('user1', Dinheiro.deReais(100))]
    const transacao = new Transacao({
      id: 'tx-1',
      descricao: 'Teste',
      total,
      origem_id: 'user1',
      pagador_id: 'user1',
      divisoes,
      status: 'pendente',
      data: new Date()
    })

    await repository.salvar(transacao)
    const encontrada = await repository.buscarPorId('tx-1')

    expect(encontrada).toBe(transacao)
  })

  it('deve retornar null ao buscar uma transação inexistente', async () => {
    const encontrada = await repository.buscarPorId('inexistente')
    expect(encontrada).toBeNull()
  })

  it('deve listar todas as transações salvas', async () => {
    const t1 = new Transacao({
      id: 'tx-1',
      descricao: 'T1',
      total: Dinheiro.deReais(10),
      origem_id: 'u1',
      pagador_id: 'u1',
      divisoes: [new Divisao('u1', Dinheiro.deReais(10))],
      status: 'pendente',
      data: new Date()
    })
    const t2 = new Transacao({
      id: 'tx-2',
      descricao: 'T2',
      total: Dinheiro.deReais(20),
      origem_id: 'u2',
      pagador_id: 'u2',
      divisoes: [new Divisao('u2', Dinheiro.deReais(20))],
      status: 'pendente',
      data: new Date()
    })

    await repository.salvar(t1)
    await repository.salvar(t2)

    const todas = await repository.listarTodas()
    expect(todas).toHaveLength(2)
    expect(todas).toContain(t1)
    expect(todas).toContain(t2)
  })
})
