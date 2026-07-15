export interface IRepository<T> {
  buscarPorId(id: string): Promise<T | null>
  salvar(entity: T): Promise<void>
  listarTodos(): Promise<T[]>
}
