import { describe, it, expect, beforeEach } from 'vitest'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { Cartao } from '../core/domain/Cartao'

describe('useCartoesEFaturas', () => {
  beforeEach(() => {
    localStorage.clear()
    const { resetar } = useCartoesEFaturas()
    resetar()
  })

  it('deve criar uma fatura aberta automaticamente para um cartao recem-salvo', async () => {
    const { cartoes, faturas, inicializar, salvarCartaoManual } = useCartoesEFaturas()
    await inicializar()
    
    const novoCard = new Cartao({ id: 'c3', nome: 'Novo Nubank', diaFechamento: 15, responsavelPadraoId: 'm1' })
    await salvarCartaoManual(novoCard)
    
    expect(cartoes.value.some(c => c.id === 'c3')).toBe(true)
    expect(faturas.value.some(f => f.cartaoId === 'c3' && f.status === 'ABERTA')).toBe(true)
  })

  it('deve atualizar um gasto completo e persistir as alterações no repositório', async () => {
    const { inicializar, faturas, gastos, salvarCartaoManual, atualizarGastoCompletoManual } = useCartoesEFaturas()
    await inicializar()
    
    // Salvar um cartão para garantir uma fatura aberta válida
    const { Cartao } = await import('../core/domain/Cartao')
    const novoCard = new Cartao({ id: 'c-teste', nome: 'Nubank Teste', diaFechamento: 15, responsavelPadraoId: 'm1' })
    await salvarCartaoManual(novoCard)

    const faturaValida = faturas.value.find(f => f.cartaoId === 'c-teste' && f.status === 'ABERTA')
    expect(faturaValida).toBeDefined()
    const faturaId = faturaValida!.id

    // 1. Cria um gasto mock direto no repositório local
    const { LocalStorageGastoRepository } = await import('../adapters/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()
    const { Dinheiro } = await import('../../../shared/primitives/Dinheiro')
    const { Gasto } = await import('../core/domain/Gasto')
    const { DivisaoDeGasto } = await import('../core/domain/DivisaoDeGasto')

    const original = new Gasto({
      id: 'g-teste-update',
      faturaId,
      descricao: 'Lanche original',
      valorTotal: Dinheiro.deCentavos(3000), // R$ 30,00
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(3000))]
    })
    await gRepo.salvar(original)
    await inicializar()

    expect(gastos.value.find(g => g.id === 'g-teste-update')?.descricao).toBe('Lanche original')

    // 2. Executa a atualização completa
    const novasDivisoes = [
      new DivisaoDeGasto('m1', Dinheiro.deCentavos(1500)),
      new DivisaoDeGasto('m2', Dinheiro.deCentavos(1500))
    ]
    await atualizarGastoCompletoManual('g-teste-update', {
      descricao: 'Pizza de calabresa',
      valorTotal: Dinheiro.deCentavos(3000),
      compradorId: 'm2',
      method: 'card',
      cardOwner: 'luan',
      divisoes: novasDivisoes,
      installments: 1
    })

    // 3. Verifica se as alterações foram salvas
    const atualizado = gastos.value.find(g => g.id === 'g-teste-update')
    expect(atualizado?.descricao).toBe('Pizza de calabresa')
    expect(atualizado?.compradorId).toBe('m2')
    expect(atualizado?.method).toBe('card')
    expect(atualizado?.cardOwner).toBe('luan')
    expect(atualizado?.divisoes.length).toBe(2)
  })
})
