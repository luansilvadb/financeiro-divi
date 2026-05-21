import type { ContaFixa } from '../domain/ContaFixa'

export interface IContaFixaRepository {
  listarTodas(): Promise<ContaFixa[]>
  salvar(conta: ContaFixa): Promise<void>
  excluir(id: string): Promise<void>
}
