# Design Spec: Refatoração e Limpeza da Codebase (Redução de Complexidade e Remoção de Código Morto)

**Data:** 2026-05-28  
**Autor:** Antigravity AI  
**Status:** Aprovado pelo Usuário  

---

## 1. Objetivos

* **Redução de Complexidade Ciclomática:** Simplificar a função `atualizarGastoCompleto` no `GastoService` dividindo-a em unidades menores e coesas.
* **Remoção de Código Morto:** Eliminar o arquivo de teste temporário `src/scratch_debug.test.ts` e imports/variáveis/comentários obsoletos.
* **Densificação do Projeto:** Garantir que cada módulo e função tenha responsabilidade justificada e clara.

---

## 2. Abordagem de Design

### 2.1 Remoção do Arquivo de Scratch
O arquivo [scratch_debug.test.ts](file:///d:/projetos/divi/src/scratch_debug.test.ts) foi usado temporariamente para debugar o fluxo do "cartão gg". Ele será excluído para evitar ruído no repositório de testes.

### 2.2 Divisão Modular de `atualizarGastoCompleto` em `GastoService.ts`
Atualmente, o método `atualizarGastoCompleto` lida com toda a orquestração de edição de gastos em uma única função de 190 linhas cheia de condicionais complexas para tratar três cenários distintos.

Vamos refatorá-lo dividindo a lógica nas seguintes subfunções privadas da classe `GastoService`:

1. **`obterPeriodosOriginal(original: Gasto): Promise<{ mes: number; ano: number }[]>`**
   * Retorna os períodos (mês/ano) que o gasto original ocupa (seja ele um parcelamento ou um gasto simples).

2. **`obterPeriodosDepois(gastoId: string): Promise<{ mes: number; ano: number }[]>`**
   * Retorna os períodos ocupados pelo gasto atualizado após a execução de sua gravação no repositório.

3. **`atualizarGastoGrupoParcelas(...)`**
   * Trata o **Caso 1**: O gasto original é parcelado.
   * Valida faturas fechadas, remove parcelas futuras se o número total mudar e relança do período de origem, ou atualiza parcelas em faturas abertas individualmente.

4. **`atualizarGastoSimplesParaParcelado(...)`**
   * Trata o **Caso 2**: O gasto original era simples e foi editado para ser parcelado em cartão.
   * Valida a fatura original, deleta o original e relança de forma parcelada a partir do período de origem.

5. **`atualizarGastoSimplesParaSimples(...)`**
   * Trata o **Caso 3**: O gasto original era simples e continua sendo simples.
   * Assegura a obtenção ou criação da fatura destino (caso o cartão ou comprador mude) e salva o gasto atualizado.

---

## 3. Plano de Verificação

### Testes Automatizados
Todos os testes existentes na suíte devem continuar passando. Rodaremos:
```bash
npx vitest run
```
Garantindo que todos os 251 testes unitários restantes continuem com 100% de sucesso.
