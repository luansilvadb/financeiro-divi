import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOnboardingViewModel } from './useOnboardingViewModel'

vi.mock('../shared/container', () => ({
  tenantSessionService: {
    criarCasa: vi.fn(),
    isAuthenticated: () => true,
    getActiveTenantId: () => 't1',
    getCurrentUserId: () => 'u1',
    inicializarSessao: vi.fn()
  },
  contaFixaRepository: {
    salvar: vi.fn()
  },
  cartaoRepository: {
    salvar: vi.fn()
  }
}))

vi.mock('./useMembros', () => ({
  useMembros: () => ({
    carregar: vi.fn(),
    currentMembro: { value: { id: 'm1' } }
  })
}))

import { tenantSessionService, contaFixaRepository, cartaoRepository } from '../shared/container'

describe('useOnboardingViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar no passo 1', () => {
    const vm = useOnboardingViewModel()
    expect(vm.etapaWizard.value).toBe(1)
  })

  it('deve validar nome da casa ao avancar do passo 1', () => {
    const vm = useOnboardingViewModel()
    vm.nomeCasa.value = ''
    vm.avancarPasso()
    expect(vm.etapaWizard.value).toBe(1)
    expect(vm.errorMsg.value).toBe('Dê um nome para a sua casa')

    vm.nomeCasa.value = 'Minha Casa'
    vm.avancarPasso()
    expect(vm.etapaWizard.value).toBe(2)
    expect(vm.errorMsg.value).toBe('')
  })

  it('deve avancar para o passo 3 a partir do passo 2', () => {
    const vm = useOnboardingViewModel()
    vm.etapaWizard.value = 2
    vm.avancarPasso()
    expect(vm.etapaWizard.value).toBe(3)
  })

  it('deve permitir voltar entre os passos', () => {
    const vm = useOnboardingViewModel()
    vm.etapaWizard.value = 2
    const onCancel = vi.fn()
    vm.voltar(onCancel)
    expect(vm.etapaWizard.value).toBe(1)
    expect(onCancel).not.toHaveBeenCalled()

    vm.voltar(onCancel)
    expect(onCancel).toHaveBeenCalled()
  })

  it('deve adicionar e remover cartoes na lista', () => {
    const vm = useOnboardingViewModel()
    vm.adicionarCartaoLista('Nubank', 10)
    expect(vm.cartoesCadastro.value.length).toBe(1)
    expect(vm.cartoesCadastro.value[0].nome).toBe('Nubank')

    vm.removerCartaoLista(0)
    expect(vm.cartoesCadastro.value.length).toBe(0)
  })

  it('deve finalizar o wizard criando a casa e salvando configuracoes', async () => {
    const vm = useOnboardingViewModel()
    vm.nomeCasa.value = 'Casa Teste'
    vm.contasSugeridas.value[0].selecionada = true
    vm.contasSugeridas.value[0].valor = '100,00'
    vm.adicionarCartaoLista('Cartao Teste', 15)

    vi.mocked(tenantSessionService.criarCasa).mockResolvedValue({ name: 'Casa Teste', inviteCode: 'CODE123' } as any)

    await vm.finalizarWizard()

    expect(tenantSessionService.criarCasa).toHaveBeenCalledWith('Casa Teste')
    expect(contaFixaRepository.salvar).toHaveBeenCalled()
    expect(cartaoRepository.salvar).toHaveBeenCalled()
    expect(vm.etapaWizard.value).toBe(4)
    expect(vm.casaCriada.value?.inviteCode).toBe('CODE123')
  })
})
