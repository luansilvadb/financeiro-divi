import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMembros } from './useMembros'

// Mocking LocalStorage to avoid side effects
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useMembros', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('deve iniciar vazio se o repositório estiver vazio', async () => {
    const { membros, carregar } = useMembros()
    
    await carregar()

    expect(membros.value.length).toBe(0)
  })

  it('deve adicionar um novo membro', async () => {
    const { membros, adicionarMembro, carregar } = useMembros()
    await carregar() 
    
    await adicionarMembro('Novo Membro')
    
    expect(membros.value.length).toBe(1)
    expect(membros.value.find(m => m.nome === 'Novo Membro')).toBeDefined()
  })

  it('deve desativar um membro', async () => {
    const { ativos, desativarMembro, carregar } = useMembros()
    await carregar() // migração
    
    const idParaDesativar = 'luan'
    await desativarMembro(idParaDesativar)
    
    expect(ativos.value.find(m => m.id === idParaDesativar)).toBeUndefined()
  })
})
