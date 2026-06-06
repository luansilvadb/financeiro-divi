import { HttpBaseRepository } from './HttpBaseRepository'
import { Cargo } from '../../entities/Cargo'
import type { ICargoRepository } from '../ICargoRepository'

export class HttpCargoRepository extends HttpBaseRepository implements ICargoRepository {
  async listarTodos(): Promise<Cargo[]> {
    const list = await this.request<any[]>('/financeiro/cargos')
    return list.map(item => new Cargo({
      id: item.id,
      nome: item.nome,
      cor: item.cor,
      permissoes: item.permissoes || [],
      totalMembros: item._count?.membros ?? 0
    }))
  }

  async salvar(cargo: Cargo): Promise<Cargo> {
    const saved = await this.request<any>('/financeiro/cargos', {
      method: 'POST',
      body: JSON.stringify({
        id: cargo.id,
        nome: cargo.nome,
        cor: cargo.cor,
        permissoes: cargo.permissoes
      })
    })
    return new Cargo({
      id: saved.id,
      nome: saved.nome,
      cor: saved.cor,
      permissoes: saved.permissoes || []
    })
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/financeiro/cargos/${id}`, {
      method: 'DELETE'
    })
  }
}
