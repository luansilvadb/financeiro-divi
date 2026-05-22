import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageCartaoRepository } from './models/repositories/local/LocalStorageCartaoRepository'
import { LocalStorageFaturaRepository } from './models/repositories/local/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from './models/repositories/local/LocalStorageGastoRepository'
import { GastoService } from './models/services/GastoService'
import { Cartao } from './models/entities/Cartao'
import { Dinheiro } from './models/entities/Dinheiro'

describe('Debug Cartao gg', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve conseguir cadastrar um cartao gg e lancar uma despesa nele', async () => {
    const cartaoRepo = new LocalStorageCartaoRepository()
    const faturaRepo = new LocalStorageFaturaRepository()
    const gastoRepo = new LocalStorageGastoRepository()

    // 1. Cadastrar cartão gg
    const cartaoGG = new Cartao({
      id: 'gg-card-id',
      nome: 'gg',
      diaFechamento: 10,
      responsavelPadraoId: 'membro-1'
    })
    await cartaoRepo.salvar(cartaoGG)

    // 2. Tentar lançar despesa no cartão gg
    const service = new GastoService(gastoRepo, faturaRepo, cartaoRepo)
    
    // Simula a chamada idêntica ao que o Wizard faz
    await service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'card',
      compradorId: 'membro-1',
      valor: 150.50,
      descricao: 'Compra no gg',
      divisoes: [{ membroId: 'membro-1', valor: Dinheiro.deReais(150.50) }],
      installments: 1,
      cardOwnerId: 'gg-card-id', // ID do cartão gg
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })

    // Verificar se o gasto foi salvo
    const todosGastos = await gastoRepo.listarTodos()
    expect(todosGastos.length).toBe(1)
    expect(todosGastos[0].descricao).toBe('Compra no gg')
    expect(todosGastos[0].cardOwner).toBe('membro-1') // O dono do cartão é o responsavelPadraoId
  })
})
