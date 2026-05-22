import { AcertoMembro } from '../entities/AcertoMembro'

export interface IAcertoMembroRepository {
  buscarPorId(id: string): Promise<AcertoMembro | null>
  buscarPorFatura(faturaId: string): Promise<AcertoMembro[]>
  salvar(acerto: AcertoMembro): Promise<void>
  excluirPorFatura(faturaId: string): Promise<void>
  listarTodos(): Promise<AcertoMembro[]>
}