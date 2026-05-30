# Plano de Implementação: Restrições de Negócio e Integridade Referencial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar restrições de integridade referencial e validações de regras de negócio em relação a cartões, faturas, gastos e membros no sistema Divi, garantindo consistência completa dos dados locais.

**Architecture:** Modificações nas entidades do domínio (`Gasto`), nos serviços principais (`GastoService`, `MembroService`), no repositório de faturas (`LocalStorageFaturaRepository`) e no viewmodel de cartões.

**Tech Stack:** TypeScript, Vue 3, Vitest, LocalStorage.

---

### Tarefa 1: Validação de Valor do Gasto > 0

**Files:**
- Modify: `src/models/entities/Gasto.ts`
- Modify: `src/models/entities/Gasto.test.ts`

- [ ] **Step 1: Escrever o teste falho e ajustar teste de divisão**
  Atualizar `src/models/entities/Gasto.test.ts` para conter o novo teste que valida valor positivo e ajustar o teste de divisões vazias (que usava valor zero) para utilizar valor positivo.
  ```typescript
  // Adicionar ao src/models/entities/Gasto.test.ts
  it('deve lançar erro se o gasto for criado com valor total menor ou igual a zero', () => {
    const total = Dinheiro.deCentavos(0)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(0))]
    expect(() => {
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, compradorId: 'm1', divisoes })
    }).toThrow('O valor total do gasto deve ser maior que zero')
  })
  
  // E ajustar o teste 'deve lançar erro se o gasto for criado sem divisões'
  it('deve lançar erro se o gasto for criado sem divisões', () => {
    const total = Dinheiro.deCentavos(1000) // Alterado de 0 para 1000
    const divisoes: DivisaoDeGasto[] = []
    
    expect(() => {
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, compradorId: 'm1', divisoes })
    }).toThrow('Um gasto deve ter pelo menos uma divisão')
  })
  ```
- [ ] **Step 2: Rodar teste e verificar falha**
  Run: `npx vitest run src/models/entities/Gasto.test.ts`
  Expected: FAIL (erro de valor positivo não lançado)
- [ ] **Step 3: Implementar validação na entidade**
  Modificar o construtor em `src/models/entities/Gasto.ts`:
  ```typescript
  constructor(props: GastoProps) {
    if (!props.valorTotal.isPositivo()) {
      throw new Error('O valor total do gasto deve ser maior que zero')
    }

    if (props.divisoes.length === 0) {
      throw new Error('Um gasto deve ter pelo menos uma divisão')
    }
    // ...
  }
  ```
- [ ] **Step 4: Rodar testes e garantir aprovação**
  Run: `npx vitest run src/models/entities/Gasto.test.ts`
  Expected: PASS
- [ ] **Step 5: Commit**
  Run: `git add src/models/entities/Gasto.ts src/models/entities/Gasto.test.ts`
  Run: `git commit -m "feat: validar que o valor do gasto deve ser maior que zero"`

---

### Tarefa 2: Exclusão de Faturas Abertas Vazias do Cartão

**Files:**
- Modify: `src/models/repositories/IFaturaRepository.ts`
- Modify: `src/models/repositories/local/LocalStorageFaturaRepository.ts`
- Modify: `src/models/repositories/local/LocalStorageFaturaRepository.test.ts`
- Modify: `src/viewmodels/useCartoesEFaturas.ts`
- Modify: `src/viewmodels/useCartoesEFaturas.test.ts`

- [ ] **Step 1: Adicionar assinatura ao repositório**
  Inserir em `src/models/repositories/IFaturaRepository.ts`:
  ```typescript
  excluirFaturasAbertasSemGastosPorCartao(cartaoId: string): Promise<void>
  ```
- [ ] **Step 2: Implementar no LocalStorageFaturaRepository**
  Modificar `src/models/repositories/local/LocalStorageFaturaRepository.ts`:
  ```typescript
  async excluirFaturasAbertasSemGastosPorCartao(cartaoId: string): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_faturas', async () => {
      const todas = this.listarTodasInternal()
      const gastoRepo = this.gastoRepo || new LocalStorageGastoRepository()
      const todosGastos = await gastoRepo.listarTodos()
      
      const filtradas = todas.filter(f => {
        if (f.cartaoId !== cartaoId) return true
        if (f.status !== 'ABERTA') return true
        // Verifica se possui gastos
        const temGastos = todosGastos.some(g => g.faturaId === f.id)
        return temGastos // se tiver gastos, mantém; se não, exclui (retorna false)
      })
      
      this.salvarListaFaturasFisicamente(filtradas)
    })
  }
  ```
- [ ] **Step 3: Escrever testes unitários para o repositório**
  Escrever teste em `src/models/repositories/local/LocalStorageFaturaRepository.test.ts` para certificar que faturas abertas vazias de um cartão são deletadas sem tocar em faturas com gastos ou fechadas.
- [ ] **Step 4: Rodar testes do repositório**
  Run: `npx vitest run src/models/repositories/local/LocalStorageFaturaRepository.test.ts`
  Expected: PASS
- [ ] **Step 5: Integrar no viewmodel de faturas**
  Modificar `src/viewmodels/useCartoesEFaturas.ts` para invocar a remoção de faturas órfãs no método `excluirCartaoManual`:
  ```typescript
  const excluirCartaoManual = async (id: string) => {
    // validações existentes de movimentação ...
    await localCartaoRepo.excluir(id)
    await localFaturaRepo.excluirFaturasAbertasSemGastosPorCartao(id) // Novo
    await carregar()
  }
  ```
- [ ] **Step 6: Adicionar teste unitário ao viewmodel**
  Ajustar `src/viewmodels/useCartoesEFaturas.test.ts` para simular a exclusão e verificar se faturas vazias somem do array local.
- [ ] **Step 7: Rodar testes do viewmodel**
  Run: `npx vitest run src/viewmodels/useCartoesEFaturas.test.ts`
  Expected: PASS
- [ ] **Step 8: Commit**
  Run: `git add src/models/repositories/IFaturaRepository.ts src/models/repositories/local/LocalStorageFaturaRepository.ts src/models/repositories/local/LocalStorageFaturaRepository.test.ts src/viewmodels/useCartoesEFaturas.ts src/viewmodels/useCartoesEFaturas.test.ts`
  Run: `git commit -m "feat: excluir faturas abertas vazias ao excluir cartao"`

---

### Tarefa 3: Desativação de Moradores com Acertos Pendentes

**Files:**
- Modify: `src/models/services/MembroService.ts`
- Modify: `src/models/services/MembroService.test.ts`
- Modify: `src/shared/container.ts`

- [ ] **Step 1: Adicionar repositório de acertos ao construtor**
  Modificar construtor de `src/models/services/MembroService.ts`:
  ```typescript
  constructor(
    private repository: IMembroRepository,
    private cartaoRepo?: ICartaoRepository,
    private gastoRepo?: IGastoRepository,
    private faturaRepo?: IFaturaRepository,
    private acertoRepo?: IAcertoMembroRepository // Novo
  ) {}
  ```
- [ ] **Step 2: Implementar bloqueio por acertos pendentes**
  Adicionar a verificação em `desativarMembro` no `MembroService.ts`:
  ```typescript
  // 4. Possua acertos pendentes (não pagos) em faturas anteriores
  if (this.acertoRepo) {
    const todosAcertos = await this.acertoRepo.listarTodos()
    const possuiAcertosPendentes = todosAcertos.some(a => a.membroId === id && !a.pago)
    if (possuiAcertosPendentes) {
      throw new Error('Não é possível desativar um morador com acertos pendentes de faturas anteriores.')
    }
  }
  ```
- [ ] **Step 3: Ajustar container e testes**
  Atualizar `src/shared/container.ts` para injetar `acertoMembroRepository` no `MembroService`.
  Ajustar testes existentes em `src/models/services/MembroService.test.ts` para mockar `acertoRepo` no construtor.
- [ ] **Step 4: Escrever o teste para desativação bloqueada**
  Adicionar em `src/models/services/MembroService.test.ts` um teste que garante que a desativação falha caso o membro possua acerto com `pago: false`.
- [ ] **Step 5: Rodar testes de membro**
  Run: `npx vitest run src/models/services/MembroService.test.ts`
  Expected: PASS
- [ ] **Step 6: Commit**
  Run: `git add src/models/services/MembroService.ts src/models/services/MembroService.test.ts src/shared/container.ts`
  Run: `git commit -m "feat: impedir desativacao de membro com acertos pendentes"`

---

### Tarefa 4: Validação de Moradores Ativos nos Gastos

**Files:**
- Modify: `src/models/services/GastoService.ts`
- Modify: `src/models/services/GastoService.test.ts`
- Modify: `src/shared/container.ts`

- [ ] **Step 1: Adicionar IMembroRepository ao construtor de GastoService**
  Modificar construtor de `src/models/services/GastoService.ts`:
  ```typescript
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository,
    private membroRepo: IMembroRepository, // Novo
    private acertoRepo?: IAcertoMembroRepository
  ) {}
  ```
- [ ] **Step 2: Ajustar injeção do container**
  Modificar `src/shared/container.ts` para passar `membroRepository` para o construtor do `GastoService`.
- [ ] **Step 3: Corrigir testes unitários existentes do GastoService**
  Ajustar os arquivos `src/models/services/GastoService.test.ts`, `GastoService_F04.test.ts`, e `GastoService_F05.test.ts` fornecendo um mock de `IMembroRepository` que retorna moradores mockados ativos para os IDs de teste.
- [ ] **Step 4: Adicionar lógica de validação de moradores ativos**
  Inserir a validação de membros no início dos métodos `lancarGastoOuEmprestimo` e `atualizarGastoCompleto` de `GastoService.ts`:
  ```typescript
  private async validarMembrosAtivos(membroIds: string[]): Promise<void> {
    for (const mId of membroIds) {
      const membro = await this.membroRepo.buscarPorId(mId)
      if (!membro || !membro.ativo) {
        throw new Error('Não é possível associar gastos a moradores inativos ou inexistentes.')
      }
    }
  }
  ```
  E fazer as chamadas nos dois métodos com os IDs envolvidos:
  - Comprador: `compradorId`
  - Tomador (se empréstimo): `borrowerId`
  - Participantes: `divisoes.map(d => d.membroId)`
- [ ] **Step 5: Escrever testes unitários específicos para bloqueio**
  Adicionar testes em `src/models/services/GastoService.test.ts` simulando lançamentos/edições com membros inativos e assegurando que lançam o erro correto.
- [ ] **Step 6: Rodar testes de GastoService**
  Run: `npx vitest run src/models/services/GastoService`
  Expected: PASS
- [ ] **Step 7: Commit**
  Run: `git add src/models/services/GastoService.ts src/models/services/GastoService.test.ts src/shared/container.ts`
  Run: `git commit -m "feat: validar moradores ativos no lancamento e edicao de gastos"`

---

### Tarefa 5: Verificação Geral e Ajustes

- [ ] **Step 1: Rodar a suíte inteira de testes**
  Run: `npx vitest run`
  Expected: All 220+ tests pass successfully.
- [ ] **Step 2: Executar manual e verificar interface**
  Iniciar o servidor local e validar visualmente as restrições ao simular exclusões e cadastros com dados inválidos.
- [ ] **Step 3: Commit de encerramento**
  Run: `git commit --allow-empty -m "chore: restricoes e integridade de dados concluidas"`
