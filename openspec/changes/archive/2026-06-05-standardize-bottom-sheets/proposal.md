## Why

Os bottom sheets do aplicativo apresentam variações de espaçamento interno e estruturas de conteúdo. Embora o componente base `BottomSheet.vue` seja robusto, o conteúdo interno em diversas partes do app precisa ser auditado e padronizado para seguir estritamente as diretrizes de design "Family" (cores, espaçamento, tipografia e elementos interativos), garantindo uma experiência de usuário coesa e de alta qualidade.

## What Changes

- Auditoria de todos os mais de 20 usos de `<BottomSheet>` no frontend.
- Padronização do espaçamento interno (padding) e das estruturas de cabeçalho.
- Garantia de que todos os formulários dentro dos bottom sheets usem tipografia consistente e estilos de botões primários/secundários conforme o design "Family".
- Verificação de que todas as cores de fundo utilizam `--color-canvas` ou `--color-stone` conforme apropriado.
- Atualização de quaisquer bottom sheets que utilizem estilos legados ou valores fixos não presentes no `DESIGN.md`.

## Capabilities

### New Capabilities
- `padronizacao-visual-bottom-sheets`: Padronização da aparência visual e layout interno de todos os bottom sheets para alinhar com o design system "Family".

### Modified Capabilities
<!-- Sem mudanças nos requisitos de capacidades existentes -->

## Impact

- `src/views/components/ui/BottomSheet.vue`: Ajustes menores no componente base, se necessário.
- Todos os componentes em `src/views/components/ledger/` e `src/views/screens/` que utilizam `BottomSheet`.
- Impacto nulo no backend ou no esquema do Prisma.
