import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('Supabase Client Initializer', () => {
  it('deve exportar a instância do cliente supabase', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })
})
