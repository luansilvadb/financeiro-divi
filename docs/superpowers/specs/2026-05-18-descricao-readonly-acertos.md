# Spec: Campo de Descrição Readonly no Registro de Acerto

**Data:** 2026-05-18
**Status:** Approved
**Topic:** UI/UX Integrity

## 1. Problema
No modal de registro de acerto (`ModalAcertoCompensacao.vue`), o campo de descrição é preenchido automaticamente pelo sistema, mas atualmente permite edição pelo usuário. Isso pode gerar inconsistências nos registros de auditoria e despadronização das mensagens de liquidação.

## 2. Solução Proposta
Tornar o campo de descrição não-editável, utilizando o atributo `readonly`. O campo continuará sendo exibido para que o usuário saiba como o acerto será registrado, mas ele não poderá alterar o texto.

### 2.1 Benefícios
- **Integridade de Dados:** Garante que a descrição do acerto sempre siga o padrão `Acerto: {De} ➜ {Para}`.
- **Redução de Erros:** Evita que o usuário apague ou altere acidentalmente a descrição necessária para identificar a transação.
- **Consistência Visual:** O campo mantém a aparência de formulário, mas com indicadores de que é somente leitura.

## 3. Detalhes Técnicos

### 3.1 Alterações no Componente
Arquivo: `src/components/ledger/dashboard/ModalAcertoCompensacao.vue`

- Adicionar atributo `readonly` ao `<input v-model="descricao">`.
- Adicionar classe `cursor-default` e remover `focus:border-ember` (ou aplicar um estilo que indique que o foco não permite edição).

### 3.2 Lógica de Preenchimento
A lógica de `watch` existente que preenche a descrição será mantida:
```typescript
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // ...
    descricao.value = `Acerto: ${props.fromName} ➜ ${props.toName}`
  }
}, { immediate: true })
```

## 4. Testes e Verificação
1. **Visual:** Abrir o modal de acerto e verificar se o campo de descrição está preenchido corretamente.
2. **Interação:** Tentar clicar e digitar no campo de descrição. O sistema deve impedir qualquer alteração no texto.
3. **Submissão:** Confirmar o acerto e verificar se a descrição enviada no evento `confirm` condiz com o texto exibido.
