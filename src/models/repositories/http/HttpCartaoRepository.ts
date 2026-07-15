import { HttpBaseRepository } from './HttpBaseRepository'
import { Cartao } from '../../entities/Cartao'
import type { ICartaoRepository } from '../ICartaoRepository'
import {
  CartaoFlexibleListResponseSchema,
  CartaoResponseSchema,
  CreateCartaoRequestSchema,
  normalizeFlexibleResponse,
} from '../../../shared/validation/apiSchemas'

type CartaoDto = ConstructorParameters<typeof Cartao>[0]

export class HttpCartaoRepository extends HttpBaseRepository implements ICartaoRepository {
  async buscarPorId(id: string): Promise<Cartao | null> {
    const list = await this.listarTodos()
    return list.find(c => c.id === id) || null
  }

  async salvar(cartao: Cartao): Promise<void> {
    const body = {
      nome: cartao.nome,
      diaFechamento: cartao.diaFechamento,
      responsavelPadraoId: cartao.responsavelPadraoId,
    }
    CreateCartaoRequestSchema.parse(body)
    await this.validatedRequest(CartaoResponseSchema, '/cartoes', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async listarTodos(): Promise<Cartao[]> {
    const raw = await this.validatedRequest(CartaoFlexibleListResponseSchema, '/cartoes')
    const list = normalizeFlexibleResponse<CartaoDto>(raw)
    return list.map(item => new Cartao({
      id: item.id,
      nome: item.nome,
      diaFechamento: item.diaFechamento,
      responsavelPadraoId: item.responsavelPadraoId
    }))
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/cartoes/${id}`, {
      method: 'DELETE'
    })
  }
}
