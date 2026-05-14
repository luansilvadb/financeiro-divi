import { describe, it, expect } from 'vitest'
import { Transacao } from './Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from './Divisao'

describe('Transação Entity', () => {
  it('deve permitir criar uma transação válida onde a soma das divisões e pagamentos é igual ao total', () => {
    const total = Dinheiro.deReais(100)
    const divisoes = [
      new Divisao('user1', Dinheiro.deReais(60)),
      new Divisao('user2', Dinheiro.deReais(40))
    ]
    const pagamentos = [
      { membro_id: 'user1', valor: Dinheiro.deReais(70) },
      { membro_id: 'user3', valor: Dinheiro.deReais(30) }
    ]
    
    const t = new Transacao({
      id: '1',
      descricao: 'Pizza',
      total,
      pagamentos,
      pagador_id: 'user2',
      divisoes,
      status: 'pendente',
      data: new Date()
    })

    expect(t.total.centavos).toBe(10000)
    expect(t.pagamentos).toHaveLength(2)
  })

  it('deve lançar erro se a soma das divisões for diferente do total', () => {
    const total = Dinheiro.deReais(100)
    const divisoes = [
      new Divisao('user1', Dinheiro.deReais(50))
    ]
    const pagamentos = [
      { membro_id: 'user1', valor: Dinheiro.deReais(100) }
    ]
    
    expect(() => new Transacao({
      id: '1',
      descricao: 'Pizza',
      total,
      pagamentos,
      pagador_id: 'user2',
      divisoes,
      status: 'pendente',
      data: new Date()
    })).toThrow('A soma das divisões deve ser igual ao total da transação')
  })

  it('deve lançar erro se a soma dos pagamentos for diferente do total', () => {
    const total = Dinheiro.deReais(100)
    const divisoes = [
      new Divisao('user1', Dinheiro.deReais(100))
    ]
    const pagamentos = [
      { membro_id: 'user1', valor: Dinheiro.deReais(50) }
    ]
    
    expect(() => new Transacao({
      id: '1',
      descricao: 'Pizza',
      total,
      pagamentos,
      pagador_id: 'user2',
      divisoes,
      status: 'pendente',
      data: new Date()
    })).toThrow('A soma dos pagamentos deve ser igual ao total da transação')
  })
})
