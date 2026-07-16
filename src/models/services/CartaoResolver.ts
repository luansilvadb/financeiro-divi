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

  // No card matched — use the first available card for cartaoId only.
  // cardOwner stays null and responsavelFaturaId stays with compradorId
  // since no explicit card owner was designated.
  const primeiroCartao = todosCartoes[0]
  if (primeiroCartao) {
    return {
      cartaoId: primeiroCartao.id,
      cardOwner: null,
      responsavelFaturaId: compradorId,
    }
  }
  return {
    cartaoId: null,
    cardOwner: null,
    responsavelFaturaId: compradorId,
  }
}
