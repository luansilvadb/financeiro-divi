# Spec de Design: Limpeza de Código Morto e Ajustes de Reembolso

## Contexto e Objetivo
Este spec detalha as ações necessárias para purificar o repositório de arquivos de desenvolvimento obsoletos (fantasmas), além de sanar os problemas de execução nos testes de domínio e integração do frontend. O objetivo é garantir que o sistema esteja enxuto, direto e funcional, mantendo apenas a fibra executável do código.

## Proposta de Alterações

### 1. Eliminação de Arquivos Mortos
Excluir permanentemente os seguintes arquivos de depuração/testes locais da pasta `backend`:
* `backend/scratch_debug.js`
* `backend/scratch_debug_short.js`
* `backend/test_admin_api.js`
* `backend/test_e2e_rest.js`

Esses arquivos eram rascunhos de testes temporários e não fazem parte da suíte de testes unitários oficiais do NestJS nem do fluxo de produção.

### 2. Correção de Referência Cega em `AcertoService`
No arquivo `src/models/services/AcertoService.ts`, a variável `fatura` é validada sem ter sido buscada no repositório. Corrigiremos inserindo a busca da fatura pelo `acerto.faturaId`:
```typescript
async registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data: Date = new Date()): Promise<void> {
  const acerto = await this.buscarEAtualizarAcerto(acertoId, valor, data)
  const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
  if (!fatura) throw new Error('Fatura não encontrada')
  
  await this.gerarGastoPixDeAcerto(acerto, fatura, valor)
  await this.sincronizarCarryover(acerto, fatura)

  await this.verificarEQuitarFatura(acerto.faturaId)
}
```

### 3. Ajuste de Injeção de Mocks do `antecipacaoRepo`
Nos testes unitários de `FaturaService`, a injeção do repositório de antecipações foi deixada como um objeto vazio `{}` via `as any`. Isso causa erros de tipo (`TypeError: this.antecipacaoRepo.buscarPorFatura is not a function`).
Ajustaremos para injetar um mock funcional:
```typescript
const antecipacaoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }
```

Arquivos impactados por este ajuste:
* `src/models/services/FaturaService.test.ts`
* `src/viewmodels/useCartoesEFaturas.test.ts`

## Plano de Verificação

### Testes Automatizados
* Executar `npx vitest run` para certificar que todos os 35 arquivos de teste e 254 testes unitários e de integração estejam passando no frontend.
