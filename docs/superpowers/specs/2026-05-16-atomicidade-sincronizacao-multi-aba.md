# Design Spec: Atomicidade e Sincronização Multi-Aba

**Data:** 2026-05-16
**Status:** Draft
**Tópico:** Resiliência e Integridade de Dados no Navegador

## 1. Visão Geral
O DIVI utiliza o `localStorage` como banco de dados primário. Como o `localStorage` não possui suporte nativo a transações ou locks, o padrão atual de "Leitura-Modificação-Escrita" é vulnerável a condições de corrida (Race Conditions) quando o app está aberto em múltiplas abas. Esta especificação detalha o uso da **Web Locks API** para garantir atomicidade e do evento **Storage** para sincronização da UI.

## 2. Objetivos
- **Atomicidade:** Garantir que apenas uma aba por vez possa ler e escrever no LocalStorage para uma mesma chave.
- **Consistência:** Sincronizar o estado visual entre todas as abas abertas assim que um dado for alterado.
- **Robustez:** Evitar corrupção de dados e sobrescritas acidentais com fallback gracioso.

## 3. Arquitetura Proposta

### 3.1 Utilitário: `StorageLock`
Local: `src/shared/utils/StorageLock.ts`

**Responsabilidades:**
- Encapsular o uso de `navigator.locks.request`.
- Fornecer fallback gracioso para ambientes sem suporte (Safari antigo, contextos seguros, etc).
- Garantir que a operação dentro do lock tenha acesso ao estado mais recente do `localStorage`.

```typescript
export class StorageLock {
  static async executarAtomico<T>(recurso: string, operacao: () => Promise<T>): Promise<T> {
    if (!navigator.locks) {
      console.warn(`Web Locks API indisponível para recurso: ${recurso}. Executando sem atomicidade multi-aba.`);
      return await operacao();
    }
    return await navigator.locks.request(recurso, async () => {
      return await operacao();
    });
  }
}
```

### 3.2 Refatoração dos Repositórios
As operações de `salvar()` nos repositórios `LocalStorageTransacaoRepository` e `LocalStorageMembroRepository` serão envolvidas pelo lock.

**Contrato de Atomicidade:**
Para garantir a integridade, o método `listarTodas()` (ou equivalente) **deve** ser chamado obrigatoriamente **dentro** do bloco do lock, garantindo que a leitura reflita o estado escrito pela última aba que obteve o lock. Como o `localStorage` é síncrono, isso garante a atomicidade do ciclo Leitura-Modificação-Escrita.

### 3.3 Sincronização Reativa: `useStorageSync`
Local: `src/modules/ledger/composables/useStorageSync.ts`

**Responsabilidades:**
- Escutar o evento `window.onstorage`.
- Disparar a recarga de dados nos composables `useMembros` e onde houver estado reativo persistido.
- **Proteção contra Loop:** O listener deve disparar apenas ações de leitura (fetch/reload). Sob nenhuma circunstância um efeito colateral de escrita deve ser disparado em resposta a um evento de sincronização.

## 4. Plano de Transição
1. **Infra:** Criar o utilitário `StorageLock`.
2. **Repositórios:** Atualizar Transações e Membros para usarem o Lock em todas as operações de escrita.
3. **Sincronização:** Implementar o listener global de storage no `App.vue` ou via composable dedicado, forçando a recarga dos dados quando a chave correspondente no `localStorage` mudar.
4. **Validação:** Realizar testes de concorrência simulada para garantir que envios simultâneos preservam todos os dados.

## 5. Critérios de Sucesso
- Zero sobrescritas de transações em testes de concorrência simulada.
- UI sincronizada automaticamente entre abas na próxima renderização (tick) após o recebimento do evento `storage`.
- Mantém a compatibilidade com a arquitetura hexagonal (Repositories).
- Degradação graciosa em navegadores sem suporte a Web Locks.
