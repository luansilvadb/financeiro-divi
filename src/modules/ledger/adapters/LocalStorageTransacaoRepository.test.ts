import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageTransacaoRepository } from './LocalStorageTransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'

describe('LocalStorageTransacaoRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve salvar e buscar uma transação reconstruindo tipos complexos', async () => {
    const repo = new LocalStorageTransacaoRepository()
    const transacao = new Transacao({
      id: '1',
      descricao: 'Teste',
      total: Dinheiro.deReais(100),
      pagamentos: [{ membro_id: 'origem', valor: Dinheiro.deReais(100) }],
      divisoes: [new Divisao('beneficiario', Dinheiro.deReais(100))],
      status: 'pendente',
      data: new Date('2024-01-01T10:00:00Z')
    })

    await repo.salvar(transacao)
    const buscada = await repo.buscarPorId('1')

    expect(buscada).not.toBeNull()
    expect(buscada?.id).toBe('1')
    expect(buscada?.total).toBeInstanceOf(Dinheiro)
    expect(buscada?.total.centavos).toBe(10000)
    expect(buscada?.total.formatar()).toBe('R$\u00a0100,00')
    expect(buscada?.data).toBeInstanceOf(Date)
    expect(buscada?.data.toISOString()).toBe('2024-01-01T10:00:00.000Z')
    expect(buscada?.divisoes[0].valor).toBeInstanceOf(Dinheiro)
    expect(buscada?.pagamentos[0].valor).toBeInstanceOf(Dinheiro)
  })

  it('deve persistir dados entre instâncias diferentes do repositório', async () => {
    const transacao = new Transacao({
      id: '2',
      descricao: 'Persistência',
      total: Dinheiro.deReais(50),
      pagamentos: [{ membro_id: 'o', valor: Dinheiro.deReais(50) }],
      divisoes: [new Divisao('b', Dinheiro.deReais(50))],
      status: 'pendente',
      data: new Date()
    })

    const repo1 = new LocalStorageTransacaoRepository()
    await repo1.salvar(transacao)

    const repo2 = new LocalStorageTransacaoRepository()
    const buscada = await repo2.buscarPorId('2')

    expect(buscada?.id).toBe('2')
    expect(buscada?.descricao).toBe('Persistência')
  })
})
