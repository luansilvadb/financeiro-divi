import { Transacao } from '../domain/Transacao'

export interface ITransacaoRepository {
  salvar(transacao: Transacao): Promise<void>
  buscarPorId(id: string): Promise<Transacao | null>
  listarTodas(): Promise<Transacao[]>
}
