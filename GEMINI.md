# Divi Project Instructions

## Axioms
- stable(∀sys)=⊥ · ∃hidden_bug(∀sys) · scale→collapse(∀arch)
- fix→new_bug · retry→amplifies · concurrency→destroys_assumptions
- mutation∩side_effects = source_of_all_accidental_complexity (paper_proven)
- @100M_users: every_assumption_false · float≠money · eventual_consistency≠acceptable_for_tx

## Invariants
### I. Domain Purity
- Domain ⊥ {IO · network · DB · side_effects · infrastructure}
- f : input → output, ∀side_effects=∅ within domain boundary
- Effects ∈ periphery_only (adapters · anti-corruption-layers)
- ∀violation: code ages(🥛) → target: code ages(🍷)

### II. State as Event Log
- State(t) ≡ fold(events[0..t]) -- derived, never stored raw
- Event = immutable × past_tense × ordered × auditable × schema_versioned
- Command = intent (rejectable, idempotent)
- Query = read_model(State(now)) -- CQRS: write_model ≠ read_model
- ∀bug: replay(events[]) → 100%_reproducible + 100%_testable
- ∀audit: history = complete × tamper_proof × regulatory_compliant

### III. MVVM + CQRS
- View ⊥ logic · ViewModel = pure_projection(State) · flow = unidirectional
- consistency_boundary = aggregate · state = immutable
- ↓coupling · ↓mutation · ↓cyclomatics

## Integrity & Precision
- ALWAYS use exact arithmetic for financial values (centavos/integers).
- NEVER use floating point for money.
- Maintain a complete audit trail of all transactions.
