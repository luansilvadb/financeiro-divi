import { describe, it, expect } from 'vitest'
import { Cartao } from '../entities/Cartao'
import { resolverCartao } from './CartaoResolver'

describe('CartaoResolver', () => {
  const cartoes = [
    new Cartao({
      id: 'c1',
      nome: 'Nu',
      diaFechamento: 5,
      responsavelPadraoId: 'membro-a',
    }),
    new Cartao({
      id: 'c2',
      nome: 'Inter',
      diaFechamento: 10,
      responsavelPadraoId: 'membro-b',
    }),
  ]

  it('Scenario: Pagamento via PIX (sem cartão)', () => {
    const res = resolverCartao('pix', 'c1', 'membro-x', cartoes)
    expect(res).toEqual({
      cartaoId: 'PIX_DEFAULT_ID',
      cardOwner: null,
      responsavelFaturaId: 'membro-x',
    })
  })

  it('Scenario: Pagamento via cartão com cardOwnerId válido (match por ID)', () => {
    const res = resolverCartao('card', 'c2', 'membro-x', cartoes)
    expect(res).toEqual({
      cartaoId: 'c2',
      cardOwner: 'membro-b',
      responsavelFaturaId: 'membro-b',
    })
  })

  it('Scenario: Pagamento via cartão com cardOwnerId válido (match por responsavelPadraoId)', () => {
    const res = resolverCartao('card', 'membro-a', 'membro-x', cartoes)
    expect(res).toEqual({
      cartaoId: 'c1',
      cardOwner: 'membro-a',
      responsavelFaturaId: 'membro-a',
    })
  })

  it('Scenario: Pagamento via cartão sem match de cardOwnerId', () => {
    const res = resolverCartao('card', 'membro-inexistente', 'membro-x', cartoes)
    expect(res).toEqual({
      cartaoId: 'c1',
      cardOwner: null,
      responsavelFaturaId: 'membro-x',
    })
  })

  it('Scenario: Pagamento via cartão sem cardOwnerId (null)', () => {
    const res = resolverCartao('card', null, 'membro-x', cartoes)
    expect(res).toEqual({
      cartaoId: 'c1',
      cardOwner: null,
      responsavelFaturaId: 'membro-x',
    })
  })

  it('Scenario: Pagamento via cartão sem nenhum cartão existente no sistema', () => {
    const res = resolverCartao('card', 'c1', 'membro-x', [])
    expect(res).toEqual({
      cartaoId: 'PIX_DEFAULT_ID',
      cardOwner: null,
      responsavelFaturaId: 'membro-x',
    })
  })
})
