import { Cartao } from '../entities/Cartao'

export interface CartaoResolvido {
  cartaoId: string | null
  cardOwner: string | null
  responsavelFaturaId: string
}

export function resolverCartao(
  method: 'pix' | 'card',
  cardOwnerId: string | null,
  compradorId: string,
  todosCartoes: Cartao[]
): CartaoResolvido {
  if (method === 'pix') {
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

  const primeiroCartao = todosCartoes[0]
  return {
    cartaoId: primeiroCartao?.id ?? null,
    cardOwner: null,
    responsavelFaturaId: compradorId,
  }
}
