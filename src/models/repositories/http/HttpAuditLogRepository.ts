import { HttpBaseRepository } from './HttpBaseRepository'

export interface AuditLogDto {
  id: string
  tenantId: string
  membroId: string
  acao: string
  detalhes: string
  createdAt: string
}

export class HttpAuditLogRepository extends HttpBaseRepository {
  async listarTodos(): Promise<AuditLogDto[]> {
    return this.request<AuditLogDto[]>('/financeiro/audit-logs')
  }
}
