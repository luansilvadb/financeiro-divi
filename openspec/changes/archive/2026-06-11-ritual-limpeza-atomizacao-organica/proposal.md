## Why

O repositório apresenta sintomas de "hipertrofia dos centros", onde componentes de UI (`ConfiguracoesMembros.vue`) e serviços de backend (`FinanceiroService.ts`) acumularam responsabilidades excessivas, criando uma "névoa" que dificulta a manutenção. Além disso, existe entropia na forma de código morto (`security.spec.ts`) e lógica desincronizada (Netting), o que compromete a integridade e a agilidade do sistema.

## What Changes

- **Atomização da UI de Membros**: Desmembramento da tela `ConfiguracoesMembros.vue` (21KB) em sub-componentes especializados: `PerfilUsuarioTab.vue`, `ControleAcessoTab.vue` e `GestaoCargosTab.vue`.
- **Refatoração de Serviços de Backend**: Fragmentação do `FinanceiroService.ts` em serviços de domínio específicos: `MembroService`, `CargoService`, `CartaoService` e `LancamentoService`.
- **Saneamento de Controladores**: Divisão do `FinanceiroController.ts` para refletir os novos serviços de domínio.
- **Exorcismo de Código Morto**: Remoção ou correção profunda do `security.spec.ts` que falha sistematicamente.
- **Sincronização do Netting**: Alinhamento da lógica de cálculo de netting no frontend com a intenção de simplificação/remoção expressa em artefatos anteriores.
- **Padronização de Logs**: Ajuste dos testes de frontend para utilizar o novo padrão de `logger` estruturado, eliminando falhas de asserção por console ruidoso.

## Capabilities

### New Capabilities
- `ritual-limpeza-atomizacao`: Processo sistemático de refatoração para redução de complexidade e remoção de entropia técnica.

### Modified Capabilities
- `controle-acesso-rbac`: Reestruturação da lógica de permissões e cargos no backend para suportar a atomização dos serviços.
- `perfil-identidade-global`: Mudança na forma como o perfil e cartões são gerenciados na UI, agora como componentes isolados.

## Impact

- **Frontend**: Componentes de configurações e viewmodels relacionados.
- **Backend**: `FinanceiroModule`, `FinanceiroController`, `FinanceiroService` e novos serviços criados.
- **Testes**: `security.spec.ts` (backend) e `TenantSessionService.test.ts` (frontend).
- **Prisma**: Nenhuma alteração de esquema prevista, apenas reestruturação de como os dados são acessados via serviços.
