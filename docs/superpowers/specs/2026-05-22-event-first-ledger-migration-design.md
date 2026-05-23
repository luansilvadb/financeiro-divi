# Spec: Migração Event-First & AUDIT∞ (Ledger Core)

**Data:** 22 de Maio de 2026
**Status:** Draft / Para Revisão
**Objetivo:** Transicionar o núcleo financeiro do Divi de um modelo CRUD para Event Sourcing, garantindo auditoria infinita, pureza de domínio e reprodutibilidade total do estado financeiro.

---

## 1. Visão Geral da Arquitetura

O sistema deixará de salvar o "estado atual" das entidades e passará a salvar a **sequência de fatos (eventos)** que levaram a esse estado.

### Componentes Chave:
- **LedgerAggregate:** Raiz de agregação responsável por validar comandos e emitir eventos. Garante a integridade financeira (ex: não permitir gastos em faturas fechadas).
- **EventStore:** Repositório imutável que armazena o stream de eventos no LocalStorage.
- **Projeções (Read Models):** Motores de cálculo que consomem o stream de eventos para reconstruir saldos, faturas e extratos em memória para a UI.

---

## 2. Modelagem de Eventos (Event Schema)

Cada evento terá um `timestamp`, `version` e um `payload` específico.

- `GASTO_LANCADO`: `{ id, faturaId, compradorId, valorCentavos, divisoes, descricao, paymentMethod }`
- `GASTO_ESTORNADO`: `{ gastoId, motivo }`
- `FATURA_FECHADA`: `{ faturaId, dataFechamento, responsavelId }`
- `ACERTO_REGISTRADO`: `{ id, faturaId, deMembroId, paraMembroId, valorCentavos, metodo }`
- `MEMBRO_ADICIONADO`: `{ id, nome, ativo }`

---

## 3. Fluxo de Execução (Command Handling)

1. **UI** despacha um `LancarGastoCommand`.
2. **ViewModel** invoca o `LedgerService`.
3. **LedgerService** carrega o `LedgerAggregate` (reconstruído a partir do stream de eventos).
4. **Aggregate** valida o comando (Regra: A fatura está aberta?).
5. Se válido, **Aggregate** produz um `GASTO_LANCADO`.
6. **EventStore** persiste o evento atomica e imutavelmente.
7. **Projeções** são atualizadas e notificam a UI (Reatividade Vue).

---

## 4. Persistência e Performance

### LocalStorage Storage Schema:
- Key: `divi_event_stream` -> `Array<Event>`
- Key: `divi_ledger_snapshot` -> Estado compactado do Ledger (para evitar reprocessar 1000+ eventos em cada refresh).

---

## 5. Estratégia de Migração (Atomic Deep Dive)

Para não perder os dados atuais, implementaremos um **Bootstrap Event Generator**:
1. Lê o estado atual (Gastos, Faturas, Membros) do LocalStorage CRUD.
2. Gera eventos sintéticos `MIGRACAO_ESTADO_INICIAL` com o timestamp original.
3. Popula o `EventStore` com esses eventos.
4. Desativa (renomeia) as chaves de armazenamento CRUD antigas.

---

## 6. Critérios de Sucesso (DoD)
- [ ] Todos os testes de `GastoService` e `NettingService` passam usando a nova engine de eventos.
- [ ] É possível reconstruir qualquer estado passado apenas filtrando o `EventLog` por data.
- [ ] A UI do Dashboard permanece funcional e reativa.
- [ ] Novo módulo `AuditTrailView` que exibe a linha do tempo bruta dos eventos.

---

## 7. Auto-Revisão (Spec Self-Review)
- **Placeholders:** Nenhum identificado.
- **Consistência:** O fluxo Command -> Aggregate -> Event está alinhado com CQRS.
- **Escopo:** Focado apenas no Ledger/Financeiro para garantir entrega.
- **Ambiguidade:** Definido `valorCentavos` para evitar erros de ponto flutuante.
