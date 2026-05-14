# DIVI Design Document

**Data:** 2026-05-14
**Status:** Draft
**Tópico:** Orquestrador Financeiro de Alta Precisão

## 1. Visão Geral
O DIVI é um orquestrador financeiro projetado para eliminar o atrito social e a carga mental em moradias compartilhadas. O foco central é a **auditabilidade** e a **precisão**, atuando como uma "Máquina da Verdade" para gastos divididos.

## 2. Requisitos de Negócio
- **Ledger Multi-entidade:** Distinguir entre "Quem Pagou" (Fonte), "Quem é o Responsável" (Pagador) e "Quem se Beneficiou" (Beneficiários).
- **Divisões Híbridas:** Suporte a divisões por pesos (ex: tamanho do quarto), partes iguais ou valores fixos.
- **Histórico Imutável:** Edições de transações criam novas versões em vez de sobrescrever dados.
- **Auditabilidade (Raise Flag):** Sistema de marcação de disputas e registro de auditoria para todas as ações administrativas.
- **Baixa Fricção:** PWA com OCR para recibos e geração de Pix Copia e Cola.
- **Governança P2P:** Modelo horizontal onde todos os membros têm direitos iguais e ações críticas exigem consenso.

## 3. Tech Stack
- **Frontend:** Vue 3 (Composition API) + TypeScript + Vite.
- **Styling:** Tailwind CSS + Lucide Icons.
- **Backend/DB:** Supabase (Postgres, Auth, Storage).
- **Observabilidade:** Sentry.
- **Testes:** Vitest.
- **Linguagem:** PT-BR (Código e UI).

## 4. Arquitetura
O sistema será organizado em módulos independentes seguindo a **Arquitetura Hexagonal (Ports & Adapters)**.

### Estrutura de Módulos:
```
src/
  modules/
    [module-name]/
      core/
        domain/         # Entidades, Value Objects, Domain Events, Domain Errors
        ports/          # Interfaces (IRepository, IClient, etc.)
        use-cases/      # Lógica de aplicação
      adapters/
        [technology]/   # Implementações (Supabase, Fetch, etc.)
      index.ts          # Interface pública única do módulo
  shared/
    primitives/         # Tipos puros, VOs e utilitários sem lógica de negócio
    errors/             # Tipos base de erro
  docs/
    adr/                # Architecture Decision Records
```

### Regras Arquiteturais:
1. **Isolamento do Core:** O Core não importa nada de `adapters/`, frameworks ou outros módulos.
2. **Encapsulamento:** `index.ts` é o único ponto de entrada. Importar de caminhos internos de outros módulos é proibido.
3. **Shared sem Negócio:** `shared/` não contém regras de negócio.
4. **Composição no Core:** No Core, comportamento compartilhado é expresso via composição e interfaces injetadas.
5. **Tradução no Boundary:** Adapters traduzem tipos de infraestrutura para tipos de domínio. Nunca passam tipos de infra (ORM rows, JSON bruto) para o Core.
6. **Testabilidade:** Módulos devem ser testáveis de forma independente.

## 5. Modelo de Dados (Ledger)
A entidade central `Transação` deve conter:
- `origem_id`: Quem pagou fisicamente (Fonte).
- `pagador_id`: Quem deve o dinheiro (Responsável).
- `divisao`: Lista de beneficiários e seus respectivos pesos/valores.
- `status`: Pendente, Auditado, Em Disputa (Flag).
- `versao`: Controle de versão para imutabilidade.

## 6. Próximos Passos
1. Setup do projeto Vue 3 + Tailwind + Vitest.
2. Implementação do Módulo de Ledger (Core Domain).
3. Integração com Supabase (Adapters).
4. Implementação da UI de Lançamento de Despesas.
