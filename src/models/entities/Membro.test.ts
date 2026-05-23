import { describe, it, expect } from 'vitest'
import { Membro } from './Membro'

describe('Membro', () => {
  it('deve criar um membro ativo por padrão', () => {
    const membro = new Membro({ id: '1', nome: 'Luan' })
    expect(membro.nome).toBe('Luan')
    expect(membro.ativo).toBe(true)
  })

  it('deve capitalizar o nome corretamente iniciando cada palavra com maiúscula', () => {
    const membro = new Membro({ id: '1', nome: 'luan silva' })
    expect(membro.nome).toBe('Luan Silva')
  })

  it('deve manter preposições de nome próprio em minúsculo', () => {
    const membro = new Membro({ id: '1', nome: 'MARIA DAS DORES DE OLIVEIRA' })
    expect(membro.nome).toBe('Maria das Dores de Oliveira')
  })

  it('deve capitalizar preposições de nome se forem a primeira palavra do nome', () => {
    const membro = new Membro({ id: '1', nome: 'de oliveira' })
    expect(membro.nome).toBe('De Oliveira')
  })
})
