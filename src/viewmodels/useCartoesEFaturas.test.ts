import { describe, it, expect, beforeEach } from 'vitest'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { Cartao } from '../models/entities/Cartao'
import { Fatura } from '../models/entities/Fatura'
import { Gasto } from '../models/entities/Gasto'
import { AcertoMembro } from '../models/entities/AcertoMembro'
import { Membro } from '../models/entities/Membro'
import { Dinheiro } from '../models/entities/Dinheiro'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'

import { LancamentoService } from '../models/services/LancamentoService'
import { EstornoService } from '../models/services/EstornoService'
import { GastoService } from '../models/services/GastoService'
import { FaturaService } from '../models/services/FaturaService'
import { AcertoService } from '../models/services/AcertoService'

class MemoriaMembroRepository {
  public items: Membro[] = []
  async listarTodos() { return this.items }
  async salvar(item: Membro) {
    this.items = this.items.filter(i => i.id !== item.id)
    this.items.push(item)
  }
  async buscarPorId(id: string) { return this.items.find(i => i.id === id) || null }
}

class MemoriaCartaoRepository {
  public items: Cartao[] = []
  async listarTodos() { return this.items }
  async salvar(item: Cartao) {
    this.items = this.items.filter(i => i.id !== item.id)
    this.items.push(item)
  }
  async buscarPorId(id: string) { return this.items.find(i => i.id === id) || null }
  async excluir(id: string) { this.items = this.items.filter(i => i.id !== id) }
}

class MemoriaFaturaRepository {
  public items: Fatura[] = []
  async listarTodas() { return this.items }
  async salvar(item: Fatura) {
    this.items = this.items.filter(i => i.id !== item.id)
    this.items.push(item)
  }
  async salvarMuitas(items: Fatura[]) {
    for (const item of items) {
      await this.salvar(item)
    }
  }
  async buscarPorId(id: string) { return this.items.find(i => i.id === id) || null }
  async buscarPorCartaoEPeriodo(cartaoId: string, periodo: any) {
    return this.items.find(i => i.cartaoId === cartaoId && i.periodo.mes === periodo.mes && i.periodo.ano === periodo.ano) || null
  }
  async executarMigracoesEDesduplicacao() {
    // No-op
  }
  async assegurarObterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string) {
    const ex = await this.buscarPorCartaoEPeriodo(cartaoId, { mes, ano })
    if (ex) return ex
    const nova = new Fatura({ id: `${cartaoId}-${mes}-${ano}`, cartaoId, periodo: { mes, ano }, responsavelId, status: 'ABERTA' })
    await this.salvar(nova)
    return nova
  }
  async excluirFaturasAbertasSemGastosPorCartao(cartaoId: string) {
    this.items = this.items.filter(i => !(i.cartaoId === cartaoId && i.status === 'ABERTA'))
  }
}

class MemoriaGastoRepository {
  public items: Gasto[] = []
  async listarTodos() { return this.items }
  async salvar(item: Gasto) {
    this.items = this.items.filter(i => i.id !== item.id)
    this.items.push(item)
  }
  async salvarMuitos(items: Gasto[]) {
    for (const item of items) {
      await this.salvar(item)
    }
  }
  async buscarPorId(id: string) { return this.items.find(i => i.id === id) || null }
  async buscarPorFatura(faturaId: string) { return this.items.filter(i => i.faturaId === faturaId) }
  async excluir(id: string) { this.items = this.items.filter(i => i.id !== id) }
  async excluirMuitos(ids: string[]) { this.items = this.items.filter(i => !ids.includes(i.id)) }
}

class MemoriaAcertoMembroRepository {
  public items: AcertoMembro[] = []
  async listarTodos() { return this.items }
  async salvar(item: AcertoMembro) {
    this.items = this.items.filter(i => i.id !== item.id)
    this.items.push(item)
  }
  async buscarPorId(id: string) { return this.items.find(i => i.id === id) || null }
  async buscarPorFatura(faturaId: string) { return this.items.filter(i => i.faturaId === faturaId) }
  async excluirPorFatura(faturaId: string) { this.items = this.items.filter(i => i.faturaId !== faturaId) }
}

describe('useCartoesEFaturas', () => {
  let mRepo: MemoriaMembroRepository
  let cRepo: MemoriaCartaoRepository
  let fRepo: MemoriaFaturaRepository
  let gRepo: MemoriaGastoRepository
  let aRepo: MemoriaAcertoMembroRepository
  let deps: any

  beforeEach(() => {
    localStorage.clear()
    mRepo = new MemoriaMembroRepository()
    cRepo = new MemoriaCartaoRepository()
    fRepo = new MemoriaFaturaRepository()
    gRepo = new MemoriaGastoRepository()
    aRepo = new MemoriaAcertoMembroRepository()

    const lService = new LancamentoService(gRepo, fRepo, cRepo, mRepo)
    const eService = new EstornoService(gRepo, fRepo, aRepo)
    const gSvc = new GastoService(gRepo, fRepo, cRepo, mRepo, aRepo, lService, eService)
    const fSvc = new FaturaService(fRepo, aRepo, gRepo)
    const aSvc = new AcertoService(aRepo, fRepo, gRepo)

    deps = {
      membroRepository: mRepo,
      cartaoRepository: cRepo,
      faturaRepository: fRepo,
      gastoRepository: gRepo,
      acertoMembroRepository: aRepo,
      gastoService: gSvc,
      faturaService: fSvc,
      acertoService: aSvc
    }
    const { resetar } = useCartoesEFaturas(deps)
    resetar()
  })

  it('deve criar uma fatura aberta automaticamente para um cartao recem-salvo', async () => {
    const { cartoes, faturas, inicializar, salvarCartaoManual } = useCartoesEFaturas(deps)
    await inicializar()
    
    const novoCard = new Cartao({ id: 'c3', nome: 'Novo Nubank', diaFechamento: 15, responsavelPadraoId: 'm1' })
    await salvarCartaoManual(novoCard)
    
    expect(cartoes.value.some(c => c.id === 'c3')).toBe(true)
    expect(faturas.value.some(f => f.cartaoId === 'c3' && f.status === 'ABERTA')).toBe(true)
  })

  it('deve atualizar um gasto completo e persistir as alterações no repositório', async () => {
    await mRepo.salvar(new Membro({ id: 'm1', nome: 'Membro Um', ativo: true }))
    await mRepo.salvar(new Membro({ id: 'm2', nome: 'Membro Dois', ativo: true }))
    await mRepo.salvar(new Membro({ id: 'luan', nome: 'Luan Silva', ativo: true }))

    const { inicializar, faturas, gastos, salvarCartaoManual, atualizarGastoCompletoManual } = useCartoesEFaturas(deps)
    await inicializar()
    
    // Salvar um cartão para garantir uma fatura aberta válida
    const novoCard = new Cartao({ id: 'c-teste', nome: 'Nubank Teste', diaFechamento: 15, responsavelPadraoId: 'luan' })
    await salvarCartaoManual(novoCard)

    const faturaValida = faturas.value.find(f => f.cartaoId === 'c-teste' && f.status === 'ABERTA')
    expect(faturaValida).toBeDefined()
    const faturaId = faturaValida!.id

    // 1. Cria um gasto mock
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

    // Mock das dependências internas dos Services se necessário, mas o próprio gastoService vai interagir com repositórios mockados agora
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
    const { inicializar, gastos } = useCartoesEFaturas(deps)
    
    // Cria um gasto direto com faturaId virtual no repositório mock
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
    const { faturas, faturasFechadas, inicializar } = useCartoesEFaturas(deps)
    
    const faturaAcertada = new Fatura({ id: 'f_acertada', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ACERTADA' })
    await fRepo.salvar(faturaAcertada)
    
    await inicializar()
    
    expect(faturas.value.some(f => f.id === 'f_acertada')).toBe(true)
    expect(faturasFechadas.value.some(f => f.id === 'f_acertada')).toBe(true)
  })

  it('excluirCartaoManual - deve permitir exclusao se nao houver movimentacao e bloquear se houver', async () => {
    const { faturas, inicializar, salvarCartaoManual, excluirCartaoManual } = useCartoesEFaturas(deps)
    
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
