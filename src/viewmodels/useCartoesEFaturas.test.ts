import { describe, it, expect, beforeEach } from 'vitest'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { Cartao } from '../models/entities/Cartao'

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
    const { LocalStorageMembroRepository } = await import('../models/repositories/local/LocalStorageMembroRepository')
    const mRepo = new LocalStorageMembroRepository()
    const { Membro } = await import('../models/entities/Membro')
    await mRepo.salvar(new Membro({ id: 'm1', nome: 'Membro Um', ativo: true }))
    await mRepo.salvar(new Membro({ id: 'm2', nome: 'Membro Dois', ativo: true }))
    await mRepo.salvar(new Membro({ id: 'luan', nome: 'Luan Silva', ativo: true }))

    const { inicializar, faturas, gastos, salvarCartaoManual, atualizarGastoCompletoManual } = useCartoesEFaturas()
    await inicializar()
    
    // Salvar um cartão para garantir uma fatura aberta válida
    const { Cartao } = await import('../models/entities/Cartao')
    const novoCard = new Cartao({ id: 'c-teste', nome: 'Nubank Teste', diaFechamento: 15, responsavelPadraoId: 'luan' })
    await salvarCartaoManual(novoCard)

    const faturaValida = faturas.value.find(f => f.cartaoId === 'c-teste' && f.status === 'ABERTA')
    expect(faturaValida).toBeDefined()
    const faturaId = faturaValida!.id

    // 1. Cria um gasto mock direto no repositório local
    const { LocalStorageGastoRepository } = await import('../models/repositories/local/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()
    const { Dinheiro } = await import('../models/entities/Dinheiro')
    const { Gasto } = await import('../models/entities/Gasto')
    const { DivisaoDeGasto } = await import('../models/entities/DivisaoDeGasto')

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

  it('deve carregar gastos associados a faturas virtuais que nao estao explicitamente salvas no banco de faturas', async () => {
    const { inicializar, gastos } = useCartoesEFaturas()
    
    // Cria um gasto direto com faturaId virtual no repositório local
    const { LocalStorageGastoRepository } = await import('../models/repositories/local/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()
    const { Dinheiro } = await import('../models/entities/Dinheiro')
    const { Gasto } = await import('../models/entities/Gasto')
    const { DivisaoDeGasto } = await import('../models/entities/DivisaoDeGasto')

    const virtualGasto = new Gasto({
      id: 'g-virtual-teste',
      faturaId: 'virtual-pix-6-2026', // Fatura virtual de PIX futura
      descricao: 'Gasto virtual futuro',
      valorTotal: Dinheiro.deCentavos(5000),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000))]
    })
    await gRepo.salvar(virtualGasto)

    // Inicializa o viewmodel
    await inicializar()

    // O gasto deve ser carregado globalmente
    expect(gastos.value.some(g => g.id === 'g-virtual-teste')).toBe(true)
  })

  it('deve incluir faturas com status ACERTADA na listagem de faturasFechadas', async () => {
    const { faturas, faturasFechadas, inicializar } = useCartoesEFaturas()
    
    const { LocalStorageFaturaRepository } = await import('../models/repositories/local/LocalStorageFaturaRepository')
    const fRepo = new LocalStorageFaturaRepository()
    const { Fatura } = await import('../models/entities/Fatura')
    
    const faturaAcertada = new Fatura({ id: 'f_acertada', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ACERTADA' })
    await fRepo.salvar(faturaAcertada)
    
    await inicializar()
    
    expect(faturas.value.some(f => f.id === 'f_acertada')).toBe(true)
    expect(faturasFechadas.value.some(f => f.id === 'f_acertada')).toBe(true)
  })

  it('excluirCartaoManual - deve permitir exclusao se nao houver movimentacao e bloquear se houver', async () => {
    const { faturas, gastos, inicializar, salvarCartaoManual, excluirCartaoManual } = useCartoesEFaturas()
    
    const card = new Cartao({ id: 'c-exclusao', nome: 'Excluir-me', diaFechamento: 15, responsavelPadraoId: 'luan' })
    await salvarCartaoManual(card)
    await inicializar()
    
    await expect(excluirCartaoManual('c-exclusao')).resolves.not.toThrow()
    expect(faturas.value.some(f => f.cartaoId === 'c-exclusao')).toBe(false)
    
    const cardBloqueado = new Cartao({ id: 'c-bloqueado', nome: 'Bloqueado', diaFechamento: 15, responsavelPadraoId: 'luan' })
    await salvarCartaoManual(cardBloqueado)
    await inicializar()
    
    const fatura = faturas.value.find(f => f.cartaoId === 'c-bloqueado' && f.status === 'ABERTA')
    expect(fatura).toBeDefined()
    
    const { LocalStorageGastoRepository } = await import('../models/repositories/local/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()
    const { Dinheiro } = await import('../models/entities/Dinheiro')
    const { Gasto } = await import('../models/entities/Gasto')
    const { DivisaoDeGasto } = await import('../models/entities/DivisaoDeGasto')
    
    const gasto = new Gasto({
      id: 'g-teste-bloqueio',
      faturaId: fatura!.id,
      descricao: 'Teste bloqueio',
      valorTotal: Dinheiro.deCentavos(1000),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deCentavos(1000))]
    })
    await gRepo.salvar(gasto)
    await inicializar()
    
    await expect(excluirCartaoManual('c-bloqueado')).rejects.toThrow('Não é possível excluir um cartão que possui movimentações')
  })
})
