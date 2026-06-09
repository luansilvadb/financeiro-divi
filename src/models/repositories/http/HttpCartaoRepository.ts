import { HttpBaseRepository } from './HttpBaseRepository'
import { Cartao } from '../../entities/Cartao'
import type { ICartaoRepository } from '../ICartaoRepository'

type CartaoDto = ConstructorParameters<typeof Cartao>[0]

export class HttpCartaoRepository extends HttpBaseRepository implements ICartaoRepository {
  async buscarPorId(id: string): Promise<Cartao | null> {
    const list = await this.listarTodos()
    return list.find(c => c.id === id) || null
  }

  async salvar(cartao: Cartao): Promise<void> {
    await this.request('/financeiro/cartoes', {
      method: 'POST',
      body: JSON.stringify({
        id: cartao.id,
        nome: cartao.nome,
        diaFechamento: cartao.diaFechamento,
        responsavelPadraoId: cartao.responsavelPadraoId
      })
    })
  }

  async listarTodos(): Promise<Cartao[]> {
    const list = await this.request<CartaoDto[]>('/financeiro/cartoes')
    return list.map(item => new Cartao({
      id: item.id,
      nome: item.nome,
      diaFechamento: item.diaFechamento,
      responsavelPadraoId: item.responsavelPadraoId
    }))
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/financeiro/cartoes/${id}`, {
      method: 'DELETE'
    })
  }
}
