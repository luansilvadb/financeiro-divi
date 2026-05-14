import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageTransacaoRepository } from './LocalStorageTransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'

describe('LocalStorageTransacaoRepository', () => {
  const STORAGE_KEY = 'divi_transactions'

  beforeEach(() => {
    localStorage.clear()
  })

  it('deve salvar e buscar uma transação reconstruindo tipos complexos', async () => {
    const repo = new LocalStorageTransacaoRepository()
    const transacao = new Transacao({
      id: '1',
      descricao: 'Teste',
      total: Dinheiro.deReais(100),
      origem_id: 'origem',
      pagador_id: 'pagador',
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
    expect(buscada?.data).toBeInstanceOf(Date)
    expect(buscada?.data.toISOString()).toBe('2024-01-01T10:00:00.000Z')
    expect(buscada?.divisoes[0].valor).toBeInstanceOf(Dinheiro)
  })
})
