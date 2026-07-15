import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpAuditLogRepository, type AuditLogDto } from './HttpAuditLogRepository'

function mockFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => json })
}

function auditLogPayload(overrides = {}): AuditLogDto {
  return {
    id: 'a1',
    tenantId: 't1',
    membroId: 'm1',
    acao: 'GASTO_CRIADO',
    detalhes: 'Supermercado - R$ 150,00',
    createdAt: '2025-06-15T14:30:00Z',
    ...overrides,
  }
}

describe('HttpAuditLogRepository', () => {
  let repo: HttpAuditLogRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem('divi_jwt_token', 'test-token')
    localStorage.setItem('divi_active_tenant_id', 'tenant-1')
    repo = new HttpAuditLogRepository()
  })

  describe('listarTodos', () => {
    it('retorna array de audit logs com validação Zod', async () => {
      vi.stubGlobal('fetch', mockFetch([auditLogPayload()]))

      const logs = await repo.listarTodos()

      expect(logs).toHaveLength(1)
      expect(logs[0].id).toBe('a1')
      expect(logs[0].tenantId).toBe('t1')
      expect(logs[0].membroId).toBe('m1')
      expect(logs[0].acao).toBe('GASTO_CRIADO')
      expect(logs[0].detalhes).toBe('Supermercado - R$ 150,00')
      expect(logs[0].createdAt).toBe('2025-06-15T14:30:00Z')
    })

    it('retorna array vazio para lista vazia', async () => {
      vi.stubGlobal('fetch', mockFetch([]))

      const logs = await repo.listarTodos()

      expect(logs).toEqual([])
    })

    it('suporta resposta paginada', async () => {
      vi.stubGlobal('fetch', mockFetch({
        data: [auditLogPayload()],
        total: 1,
        page: 1,
        page_size: 20,
        totalPages: 1,
      }))

      const logs = await repo.listarTodos()

      expect(logs).toHaveLength(1)
      expect(logs[0].acao).toBe('GASTO_CRIADO')
    })

    it('lança erro se resposta não passar na validação Zod', async () => {
      vi.stubGlobal('fetch', mockFetch([{ id: 123, tenantId: 't1' }]))

      await expect(repo.listarTodos()).rejects.toThrow('[API Contract]')
    })

    it('trata múltiplos logs', async () => {
      vi.stubGlobal('fetch', mockFetch([
        auditLogPayload({ id: 'a1', acao: 'MEMBRO_CRIADO' }),
        auditLogPayload({ id: 'a2', acao: 'CARTAO_CRIADO' }),
        auditLogPayload({ id: 'a3', acao: 'GASTO_EXCLUIDO' }),
      ]))

      const logs = await repo.listarTodos()

      expect(logs).toHaveLength(3)
      expect(logs.map(l => l.acao)).toEqual(['MEMBRO_CRIADO', 'CARTAO_CRIADO', 'GASTO_EXCLUIDO'])
    })
  })
})
