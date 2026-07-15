import { ref } from 'vue'
import { tenantSessionService, contaFixaRepository, cartaoRepository } from '../shared/container'
import { Cartao } from '../models/entities/Cartao'
import { useMembros } from './useMembros'
import { logger } from '../shared/utils/logger'
import { useAsync } from '../composables/useAsync'

export interface ContaOnboarding {
  id: string
  name: string
  icon: string
  selecionada: boolean
  valor: string
}

export interface CartaoOnboarding {
  nome: string
  diaFechamento: number
}

export function useOnboardingViewModel() {
  const { loading, errorMsg, run } = useAsync()
  
  const etapaWizard = ref(1) // 1 = Nome, 2 = Contas Fixas, 3 = Cartões, 4 = Conclusão
  const nomeCasa = ref('')
  
  const contasSugeridas = ref<ContaOnboarding[]>([
    { id: 'aluguel', name: 'Aluguel', icon: '🔑', selecionada: true, valor: '1500,00' },
    { id: 'luz', name: 'Energia (Luz)', icon: '💡', selecionada: true, valor: '' },
    { id: 'agua', name: 'Água', icon: '💧', selecionada: true, valor: '' },
    { id: 'internet', name: 'Internet / Wi-Fi', icon: '🌐', selecionada: true, valor: '120,00' },
    { id: 'pet', name: 'Cuidados Pet', icon: '🐶', selecionada: false, valor: '' },
    { id: 'limpeza', name: 'Faxina / Limpeza', icon: '🧹', selecionada: false, valor: '' }
  ])

  const cartoesCadastro = ref<CartaoOnboarding[]>([])
  const casaCriada = ref<null | { name: string; inviteCode: string }>(null)

  const avancarPasso = () => {
    if (etapaWizard.value === 1) {
      if (!nomeCasa.value.trim()) {
        errorMsg.value = 'Dê um nome para a sua casa'
        return
      }
      errorMsg.value = ''
      etapaWizard.value = 2
    } else if (etapaWizard.value === 2) {
      etapaWizard.value = 3
    }
  }

  const voltar = (onCancel: () => void) => {
    if (etapaWizard.value > 1 && etapaWizard.value < 4) {
      etapaWizard.value -= 1
      errorMsg.value = ''
    } else {
      onCancel()
    }
  }

  const adicionarContaCustomizada = (nome: string, icon: string, valor: string) => {
    if (!nome.trim()) return
    contasSugeridas.value.push({
      id: `custom-${Math.random().toString(36).substring(2, 9)}`,
      name: nome.trim(),
      icon: icon,
      selecionada: true,
      valor: valor
    })
  }

  const adicionarCartaoLista = (nome: string, dia: number) => {
    if (!nome.trim()) return
    cartoesCadastro.value.push({
      nome: nome.trim(),
      diaFechamento: Math.min(Math.max(dia, 1), 31)
    })
  }

  const removerCartaoLista = (index: number) => {
    cartoesCadastro.value.splice(index, 1)
  }

  const finalizarWizard = async () => {
    errorMsg.value = ''
    
    const tenant = await run(
      () => tenantSessionService.criarCasa(nomeCasa.value.trim()),
      'Não foi possível criar a casa'
    )

    if (!tenant) return

    try {
      const membrosVM = useMembros()
      await membrosVM.carregar()
      const membroLogado = membrosVM.currentMembro.value
      const responsavelId = membroLogado ? membroLogado.id : 'membro-criador'

      for (const conta of contasSugeridas.value) {
        if (conta.selecionada) {
          let valorCentavos: number | null = null
          if (conta.valor) {
            const limpo = conta.valor.replace(',', '.')
            const num = parseFloat(limpo)
            if (!isNaN(num)) {
              valorCentavos = Math.round(num * 100)
            }
          }
          await contaFixaRepository.salvar({
            id: conta.id,
            name: conta.name,
            icon: conta.icon,
            fixedValueCentavos: valorCentavos,
            defaultSplit: []
          })
        }
      }

      for (const cartao of cartoesCadastro.value) {
        const cartaoEntity = new Cartao({
          id: `cartao-${crypto.randomUUID()}`,
          nome: cartao.nome,
          diaFechamento: cartao.diaFechamento,
          responsavelPadraoId: responsavelId
        })
        await cartaoRepository.salvar(cartaoEntity)
      }

      casaCriada.value = tenant
      etapaWizard.value = 4
    } catch (e) {
      logger.error('Erro ao salvar parametrizações iniciais:', e)
      errorMsg.value = 'Erro ao salvar as configurações iniciais da casa.'
    }
  }

  return {
    loading,
    errorMsg,
    etapaWizard,
    nomeCasa,
    contasSugeridas,
    cartoesCadastro,
    casaCriada,
    avancarPasso,
    voltar,
    adicionarContaCustomizada,
    adicionarCartaoLista,
    removerCartaoLista,
    finalizarWizard
  }
}
