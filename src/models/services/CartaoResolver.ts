import { Cartao } from '../entities/Cartao'
import type { PaymentMethod } from '../entities/Gasto'

export interface CartaoResolvido {
  cartaoId: string | null
  cardOwner: string | null
  responsavelFaturaId: string
}

export function resolverCartao(
  method: PaymentMethod,
  cardOwnerId: string | null,
  compradorId: string,
  todosCartoes: Cartao[]
): CartaoResolvido {
  if (method !== 'card') {
    return {
      cartaoId: null,
      cardOwner: null,
      responsavelFaturaId: compradorId,
    }
  }

  const cartaoReal = cardOwnerId
    ? todosCartoes.find(
        (c) => c.id === cardOwnerId || c.responsavelPadraoId === cardOwnerId
      )
    : undefined

  if (cartaoReal) {
    return {
      cartaoId: cartaoReal.id,
      cardOwner: cartaoReal.responsavelPadraoId,
      responsavelFaturaId: cartaoReal.responsavelPadraoId,
    }
  }

  // No card matched — if there's exactly one card, use it as a reasonable default.
  // Otherwise return null cardId so callers can handle the missing-card case.
  if (todosCartoes.length === 1) {
    const unico = todosCartoes[0]
    return {
      cartaoId: unico.id,
      cardOwner: unico.responsavelPadraoId,
      responsavelFaturaId: unico.responsavelPadraoId,
    }
  }
  return {
    cartaoId: null,
    cardOwner: null,
    responsavelFaturaId: compradorId,
  }
}
