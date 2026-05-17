import { describe, it, expect, vi, afterEach } from 'vitest'
import { StorageLock } from './StorageLock'

describe('StorageLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('deve usar navigator.locks quando disponível', async () => {
    const mockRequest = vi.fn((_, op) => op())
    vi.stubGlobal('navigator', { locks: { request: mockRequest } })
    
    const result = await StorageLock.executarAtomico('test', async () => 'ok')
    
    expect(mockRequest).toHaveBeenCalledWith('test', expect.any(Function))
    expect(result).toBe('ok')
  })

  it('deve executar sem lock quando API indisponível (fallback)', async () => {
    vi.stubGlobal('navigator', {}) // Sem locks API
    
    const result = await StorageLock.executarAtomico('test', async () => 'fallback')
    expect(result).toBe('fallback')
  })

  it('deve propagar erros da operação', async () => {
    const error = new Error('falha na operação')
    await expect(StorageLock.executarAtomico('test', async () => {
      throw error
    })).rejects.toThrow('falha na operação')
  })
})
