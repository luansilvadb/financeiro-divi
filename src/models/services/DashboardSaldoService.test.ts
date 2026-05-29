import { describe, expect, it } from 'vitest'
import { Fatura } from '../entities/Fatura'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { separarGastosSaldoRealEPreviaCartao, calcularPreviaCartaoAberto } from './DashboardSaldoService'

describe('DashboardSaldoService', () => {
  const faturaPix = new Fatura({ id: 'pix-maio', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
  const faturaCartaoAberta = new Fatura({ id: 'card-maio', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'luan', status: 'ABERTA' })
  const faturaCartaoFechada = new Fatura({ id: 'card-abril', cartaoId: 'c1', periodo: { mes: 4, ano: 2026 }, responsavelId: 'luan', status: 'FECHADA' })

  it('deve manter pix no saldo real e cartao aberto fora do saldo real', () => {
    const pix = new Gasto({
      id: 'g-pix',
      faturaId: 'pix-maio',
      descricao: 'Mercado pix',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('joao', Dinheiro.deReais(100))],
      method: 'pix'
    })
    const card = new Gasto({
      id: 'g-card',
      faturaId: 'card-maio',
      descricao: 'Mercado cartao',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('joao', Dinheiro.deReais(300))],
      method: 'card',
      cardOwner: 'luan'
    })

    const result = separarGastosSaldoRealEPreviaCartao([pix, card], [faturaPix, faturaCartaoAberta])

    expect(result.gastosSaldoReal.map(g => g.id)).toEqual(['g-pix'])
    expect(result.gastosPrevisaoCartao.map(g => g.id)).toEqual(['g-card'])
  })

  it('deve deixar gastos brutos de fatura fechada fora do saldo real porque a divida vem de AcertoMembro', () => {
    const cardFechado = new Gasto({
      id: 'g-card-fechado',
      faturaId: 'card-abril',
      descricao: 'Cartao fechado',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('joao', Dinheiro.deReais(300))],
      method: 'card',
      cardOwner: 'luan'
    })

    const result = separarGastosSaldoRealEPreviaCartao([cardFechado], [faturaCartaoFechada])

    expect(result.gastosSaldoReal).toEqual([])
    expect(result.gastosPrevisaoCartao).toEqual([])
  })

  it('deve calcular previa de cartao aberto por membro', () => {
    const card = new Gasto({
      id: 'g-card',
      faturaId: 'card-maio',
      descricao: 'Mercado cartao',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [
        new DivisaoDeGasto('joao', Dinheiro.deReais(200)),
        new DivisaoDeGasto('maria', Dinheiro.deReais(100))
      ],
      method: 'card',
      cardOwner: 'luan'
    })

    expect(calcularPreviaCartaoAberto([card])).toEqual({
      joao: 20000,
      maria: 10000
    })
  })

  it('deve incluir gastos de settlement com detalhes de netting se a fatura estiver aberta', () => {
    const settlementAberto = new Gasto({
      id: 'g-settlement',
      faturaId: 'pix-maio',
      descricao: 'Acerto de contas',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'joao',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(50))],
      method: 'pix',
      isSettlement: true,
      settlementDetails: {
        fromMemberId: 'joao',
        toMemberId: 'luan',
        method: 'pix'
      }
    })

    const result = separarGastosSaldoRealEPreviaCartao([settlementAberto], [faturaPix])

    expect(result.gastosSaldoReal.map(g => g.id)).toEqual(['g-settlement'])
  })

  it('deve ignorar gastos de settlement com detalhes de netting se a fatura estiver fechada', () => {
    const faturaPixFechada = new Fatura({ id: 'pix-abril', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 4, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'FECHADA' })
    const settlementFechado = new Gasto({
      id: 'g-settlement',
      faturaId: 'pix-abril',
      descricao: 'Acerto de contas',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'joao',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(50))],
      method: 'pix',
      isSettlement: true,
      settlementDetails: {
        fromMemberId: 'joao',
        toMemberId: 'luan',
        method: 'pix'
      }
    })

    const result = separarGastosSaldoRealEPreviaCartao([settlementFechado], [faturaPixFechada])

    expect(result.gastosSaldoReal).toEqual([])
  })

  it('deve incluir gastos de settlement sem detalhes de netting (ex: carryover) apenas se a fatura estiver fechada', () => {
    const faturaPixFechada = new Fatura({ id: 'pix-abril', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 4, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'FECHADA' })
    
    const carryoverAberto = new Gasto({
      id: 'g-carryover-aberto',
      faturaId: 'pix-maio',
      descricao: 'Carryover',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'joao',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(50))],
      method: 'pix',
      isSettlement: true
    })

    const carryoverFechado = new Gasto({
      id: 'g-carryover-fechado',
      faturaId: 'pix-abril',
      descricao: 'Carryover',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'joao',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(50))],
      method: 'pix',
      isSettlement: true
    })

    const resultAberto = separarGastosSaldoRealEPreviaCartao([carryoverAberto], [faturaPix])
    const resultFechado = separarGastosSaldoRealEPreviaCartao([carryoverFechado], [faturaPixFechada])

    expect(resultAberto.gastosSaldoReal).toEqual([])
    expect(resultFechado.gastosSaldoReal.map(g => g.id)).toEqual(['g-carryover-fechado'])
  })

  it('deve ignorar gasto de netting fisico se houver uma fatura de cartao fechada no mesmo periodo para evitar contagem dupla', () => {
    const faturaPixAbril = new Fatura({ id: 'pix-abril', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 4, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
    const faturaCartaoAbrilFechada = new Fatura({ id: 'card-abril', cartaoId: 'c1', periodo: { mes: 4, ano: 2026 }, responsavelId: 'luan', status: 'FECHADA' })

    const nettingFisico = new Gasto({
      id: 'g-netting-fisico',
      faturaId: 'pix-abril',
      descricao: 'Acerto de contas',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'joao',
      divisoes: [new DivisaoDeGasto('luan', Dinheiro.deReais(50))],
      method: 'pix',
      isSettlement: true,
      settlementDetails: {
        fromMemberId: 'joao',
        toMemberId: 'luan',
        method: 'pix'
      }
    })

    const result = separarGastosSaldoRealEPreviaCartao([nettingFisico], [faturaPixAbril, faturaCartaoAbrilFechada])

    expect(result.gastosSaldoReal).toEqual([])
  })
})
