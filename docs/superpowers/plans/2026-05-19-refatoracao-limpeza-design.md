# Refatoração e Limpeza de Código Morto - Plano de Implementação

> **Para agentes de execução:** SUB-SKILL REQUERIDA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam a sintaxe de caixa de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** Limpar a codebase removendo componentes inteiramente mortos (não importados e sem propósito ativo) como `InvertedSection.vue` e `BottomSheetDivisaoGasto.vue`, garantindo a eliminação de stubs órfãos em arquivos de teste e validando que o build e os testes passem com 100% de sucesso.

**Arquitetura:** Remoção cirúrgica de arquivos órfãos via controle de versão (git) e limpeza de trechos de testes correspondentes, sem alterar a lógica de negócios ou a persistência.

**Tech Stack:** Vue 3, TypeScript, Vitest, Git.

---

### Tarefa 1: Limpeza do Componente Morto InvertedSection

**Arquivos:**
- Remover: `src/components/ui/InvertedSection.vue`
- Modificar: `src/App.test.ts:51-53`

- [ ] **Passo 1: Remover o stub de InvertedSection no teste**

Modificar o arquivo `src/App.test.ts` removendo o stub de `InvertedSection`.

O conteúdo em `src/App.test.ts` ao redor da linha 51 é:
```typescript
          InvertedSection: {
            template: '<section><slot /></section>',
          },
```

Deve ser removido para ficar assim:
```typescript
        stubs: {
          DashboardSaldos: true,
          NovoLancamentoWizard: true,
          ConfiguracoesMembros: true,
          BottomSheet: {
            template: '<div><slot /></div>',
          },
        },
```

- [ ] **Passo 2: Remover fisicamente o arquivo InvertedSection.vue**

Executar a remoção do arquivo usando git:
```powershell
git rm src/components/ui/InvertedSection.vue
```

- [ ] **Passo 3: Executar testes de integração para validar a alteração**

Executar a suíte de testes com vitest:
```powershell
npx vitest run src/App.test.ts
```
Esperado: PASS

---

### Tarefa 2: Limpeza do Componente Morto BottomSheetDivisaoGasto

**Arquivos:**
- Remover: `src/components/ledger/dashboard/BottomSheetDivisaoGasto.vue`

- [ ] **Passo 1: Remover fisicamente o arquivo BottomSheetDivisaoGasto.vue**

Executar a remoção do arquivo usando git:
```powershell
git rm src/components/ledger/dashboard/BottomSheetDivisaoGasto.vue
```

- [ ] **Passo 2: Rodar o build completo para garantir que nenhum outro componente dependia dele de forma oculta**

Executar:
```powershell
npm run build
```
Esperado: Compilação sem erros.

---

### Tarefa 3: Verificação de Regressão e Validação Final

- [ ] **Passo 1: Rodar a suíte completa de testes unitários**

Executar todos os testes:
```powershell
npx vitest run
```
Esperado: Todos os 130 testes passam.

- [ ] **Passo 2: Commitar as limpezas realizadas**

Executar:
```powershell
git add src/App.test.ts
git commit -m "refactor: remove InvertedSection and BottomSheetDivisaoGasto dead components"
```
