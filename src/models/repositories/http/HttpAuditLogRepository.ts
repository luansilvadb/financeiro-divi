import { HttpBaseRepository } from './HttpBaseRepository'
import { AuditLogFlexibleListResponseSchema, normalizeFlexibleResponse } from '../../../shared/validation/apiSchemas'

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
    const raw = await this.validatedRequest(AuditLogFlexibleListResponseSchema, '/audit-logs')
    return normalizeFlexibleResponse<AuditLogDto>(raw)
  }
}
