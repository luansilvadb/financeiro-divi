<script setup lang="ts">
import SkeletonBlock from './SkeletonBlock.vue'

interface Props {
  variant?: 'hoje' | 'faturas'
  memberRows?: number
  fixedBillRows?: number
  activityRows?: number
  nettingRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'hoje',
  memberRows: 3,
  fixedBillRows: 3,
  activityRows: 3,
  nettingRows: 0
})

const delay = (index: number, offset = 0) => `${(index + offset) * 70}ms`
</script>

<template>
  <section
    class="skeleton-theme"
    aria-busy="true"
    aria-live="polite"
    data-testid="skeleton-mimic"
  >
    <span class="sr-only" role="status">Carregando dados do dashboard</span>

    <div
      class="pointer-events-none select-none space-y-12"
      aria-hidden="true"
      data-testid="skeleton-visual"
    >
      <header class="flex items-center justify-between pb-6 pt-3 mb-8 border-b border-stone/50">
        <div class="flex-1 space-y-2">
          <SkeletonBlock shape="text" tone="soft" width="3rem" height="0.625rem" />
          <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.5rem" delay="70ms" />
        </div>
        <div class="flex-1 flex flex-col items-center gap-2">
          <SkeletonBlock shape="text" tone="soft" width="5.5rem" height="0.625rem" delay="140ms" />
          <SkeletonBlock shape="text" tone="strong" width="4rem" height="1.75rem" delay="210ms" />
        </div>
        <div class="flex-1 flex justify-end">
          <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" delay="280ms" />
        </div>
      </header>

      <template v-if="props.variant === 'hoje'">
        <section class="space-y-4">
          <div class="skeleton-shell" data-testid="skeleton-balance-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="9rem" height="1.125rem" delay="70ms" />
                <SkeletonBlock shape="text" tone="soft" width="11rem" height="0.6875rem" delay="140ms" />
              </div>
            </div>
            <div class="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div
                v-for="row in props.memberRows"
                :key="`balance-${row}`"
                class="flex justify-between items-center p-3 sm:p-4 rounded-2xl border border-stone bg-canvas"
                data-testid="skeleton-balance-row"
              >
                <div class="flex items-center gap-3 sm:gap-4">
                  <SkeletonBlock shape="circle" width="3rem" height="3rem" :delay="delay(row)" />
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="6.5rem" height="0.875rem" :delay="delay(row, 1)" />
                    <SkeletonBlock shape="text" tone="soft" width="5rem" height="0.625rem" :delay="delay(row, 2)" />
                  </div>
                </div>
                <SkeletonBlock shape="text" tone="strong" width="5.5rem" height="1.5rem" :delay="delay(row, 3)" />
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div class="skeleton-shell" data-testid="skeleton-netting-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="10rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="12rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-6 grid gap-4">
              <div
                v-for="row in props.nettingRows"
                :key="`netting-${row}`"
                class="p-5 border border-stone bg-canvas rounded-2xl space-y-5"
                data-testid="skeleton-netting-row"
              >
                <div class="flex gap-4">
                  <SkeletonBlock shape="circle" width="3rem" height="3rem" :delay="delay(row)" />
                  <div class="flex-1 space-y-3">
                    <SkeletonBlock shape="text" width="70%" height="0.875rem" :delay="delay(row, 1)" />
                    <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.875rem" :delay="delay(row, 2)" />
                  </div>
                </div>
                <SkeletonBlock width="100%" height="3rem" radius="0.75rem" :delay="delay(row, 3)" />
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div class="skeleton-shell" data-testid="skeleton-fixed-bills-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="8rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-6 grid gap-3">
              <div
                v-for="row in props.fixedBillRows"
                :key="`fixed-${row}`"
                class="flex items-center justify-between p-4 rounded-xl border border-stone bg-canvas"
                data-testid="skeleton-fixed-bill-row"
              >
                <div class="flex items-center gap-4">
                  <SkeletonBlock width="2.5rem" height="2.5rem" radius="0.5rem" :delay="delay(row)" />
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="6rem" height="0.875rem" :delay="delay(row, 1)" />
                    <SkeletonBlock shape="text" tone="soft" width="8.5rem" height="0.625rem" :delay="delay(row, 2)" />
                  </div>
                </div>
                <SkeletonBlock shape="circle" tone="soft" width="1.5rem" height="1.5rem" :delay="delay(row, 3)" />
              </div>
              <div
                class="mt-3 flex justify-center rounded-xl border border-dashed border-stone bg-canvas/50 p-4"
                data-testid="skeleton-add-fixed-bill"
              >
                <SkeletonBlock shape="text" tone="soft" width="9rem" height="0.625rem" />
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div class="skeleton-shell" data-testid="skeleton-activity-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="6rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="10rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-6 space-y-4">
              <div
                v-for="row in props.activityRows"
                :key="`activity-${row}`"
                class="p-4 rounded-xl border border-stone bg-canvas space-y-4"
                data-testid="skeleton-activity-row"
              >
                <div class="flex justify-between gap-4">
                  <div class="flex-1 space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="65%" height="0.875rem" :delay="delay(row)" />
                    <SkeletonBlock shape="text" tone="soft" width="45%" height="0.625rem" :delay="delay(row, 1)" />
                  </div>
                  <SkeletonBlock shape="text" tone="strong" width="4.5rem" height="1.125rem" :delay="delay(row, 2)" />
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-stone">
                  <SkeletonBlock width="4.5rem" height="2.25rem" radius="0.5rem" :delay="delay(row, 3)" />
                  <SkeletonBlock width="4.5rem" height="2.25rem" radius="0.5rem" :delay="delay(row, 4)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <div
          class="mt-6 p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-canvas border-2 border-stone shadow-subtle rounded-2xl"
          data-testid="skeleton-period-status"
        >
          <div class="flex items-center gap-5 w-full">
            <SkeletonBlock width="3rem" height="3rem" radius="0.75rem" />
            <div class="space-y-3 flex-1 max-w-[25rem]">
              <SkeletonBlock shape="text" tone="strong" width="9rem" height="1.25rem" />
              <SkeletonBlock shape="text" tone="soft" width="100%" height="0.8125rem" />
            </div>
          </div>
          <SkeletonBlock width="100%" height="3rem" radius="0.75rem" class="md:max-w-40" />
        </div>

        <section class="space-y-4">
          <div class="skeleton-shell" data-testid="skeleton-breakdown-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="8.5rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="12rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-8 space-y-12">
              <div
                v-for="member in props.memberRows"
                :key="`breakdown-${member}`"
                class="space-y-6"
                data-testid="skeleton-member-breakdown"
              >
                <div class="flex justify-between items-center px-1 gap-4">
                  <div class="flex items-center gap-4">
                    <SkeletonBlock shape="circle" width="3.5rem" height="3.5rem" :delay="delay(member)" />
                    <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.5rem" :delay="delay(member, 1)" />
                  </div>
                  <SkeletonBlock width="6.5rem" height="2rem" radius="9999px" :delay="delay(member, 2)" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    v-for="summary in 3"
                    :key="summary"
                    class="rounded-2xl bg-parchment p-5 space-y-6 shadow-subtle"
                    data-testid="skeleton-financial-summary"
                  >
                    <div class="flex items-center gap-3">
                      <SkeletonBlock shape="circle" width="2.25rem" height="2.25rem" :delay="delay(member, summary)" />
                      <SkeletonBlock shape="text" tone="soft" width="5rem" height="0.625rem" :delay="delay(member, summary + 1)" />
                    </div>
                    <div class="space-y-3">
                      <SkeletonBlock shape="text" width="100%" height="0.75rem" />
                      <div class="h-px bg-stone" />
                      <SkeletonBlock shape="text" width="100%" height="0.75rem" />
                    </div>
                  </div>
                </div>
                <div class="flex justify-center pt-2">
                  <SkeletonBlock width="10rem" height="2.25rem" radius="9999px" :delay="delay(member, 4)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>

<style scoped>
.skeleton-theme {
  --skeleton-base: rgba(242, 240, 237, 0.88);
  --skeleton-soft: rgba(242, 240, 237, 0.56);
  --skeleton-strong: rgba(226, 223, 219, 0.96);
  --skeleton-highlight: rgba(255, 255, 255, 0.72);
  --skeleton-duration: 1.8s;
  --skeleton-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.dark) .skeleton-theme {
  --skeleton-base: rgba(71, 70, 69, 0.88);
  --skeleton-soft: rgba(71, 70, 69, 0.56);
  --skeleton-strong: rgba(92, 90, 88, 0.96);
  --skeleton-highlight: rgba(255, 255, 255, 0.1);
}

.skeleton-shell {
  overflow: hidden;
  border: 1px solid rgba(242, 240, 237, 0.3);
  border-radius: 1.25rem;
  background: var(--color-card);
  box-shadow: var(--shadow-subtle);
}

.skeleton-panel-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-stone);
  background: var(--color-parchment);
}

@media (min-width: 640px) {
  .skeleton-panel-header {
    padding: 1.75rem 1.5rem;
  }
}
</style>
