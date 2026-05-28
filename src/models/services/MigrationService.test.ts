import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MigrationService } from './MigrationService'

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue({ error: null })
  }))
}

const mockLocalMembro = { listarTodos: vi.fn().mockResolvedValue([]) }
const mockLocalCartao = { listarTodos: vi.fn().mockResolvedValue([]) }
const mockLocalFatura = { listarTodas: vi.fn().mockResolvedValue([]) }
const mockLocalGasto = { listarTodos: vi.fn().mockResolvedValue([]) }
const mockLocalContaFixa = { listarTodas: vi.fn().mockResolvedValue([]) }
const mockLocalAcerto = { listarTodos: vi.fn().mockResolvedValue([]) }

describe('MigrationService', () => {
  let service: MigrationService

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    service = new MigrationService(
      mockSupabase as any,
      mockLocalMembro as any,
      mockLocalCartao as any,
      mockLocalFatura as any,
      mockLocalGasto as any,
      mockLocalContaFixa as any,
      mockLocalAcerto as any
    )
  })

  it('deve executar a migração sem erros se o localstorage estiver vazio', async () => {
    await expect(service.migrar('tenant-123', 'user-456')).resolves.not.toThrow()
    expect(localStorage.getItem('divi_migrado_saas')).toBe('true')
  })
})
