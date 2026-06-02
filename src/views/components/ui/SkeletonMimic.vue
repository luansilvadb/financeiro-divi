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

const delay = (index: number, offset = 0) => `${index * 80 + offset}ms`
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
      class="pointer-events-none select-none"
      aria-hidden="true"
      data-testid="skeleton-visual"
    >
      <header class="flex items-center justify-between pb-6 pt-3 mb-8 border-b border-stone/50">
        <div class="flex-1">
          <div class="flex flex-col items-start p-1 -ml-1">
            <SkeletonBlock shape="text" tone="soft" width="3.25rem" height="0.625rem" :delay="delay(0)" />
            <SkeletonBlock class="mt-2" shape="text" tone="strong" width="6.75rem" height="1.75rem" :delay="delay(1)" />
          </div>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center">
          <div class="flex items-center justify-center gap-1.5 mb-2">
            <SkeletonBlock shape="circle" tone="base" width="0.875rem" height="0.875rem" :delay="delay(2)" />
            <SkeletonBlock shape="text" tone="base" width="3.75rem" height="0.625rem" :delay="delay(3)" />
          </div>
          <SkeletonBlock shape="text" tone="strong" width="4.25rem" height="1.875rem" :delay="delay(4)" />
        </div>

        <div class="flex-1 flex justify-end">
          <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" :delay="delay(5)" />
        </div>
      </header>

      <div v-if="props.variant === 'hoje'" class="space-y-12 pb-32">
        <section class="space-y-6">
          <div class="skeleton-section-label">
            <SkeletonBlock shape="circle" tone="strong" width="0.375rem" height="0.375rem" :delay="delay(1)" />
            <SkeletonBlock shape="text" tone="soft" width="5.75rem" height="0.625rem" :delay="delay(2)" />
          </div>

          <div class="skeleton-shell" data-testid="skeleton-balance-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" :delay="delay(2)" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="9.25rem" height="1.125rem" :delay="delay(3)" />
                <SkeletonBlock shape="text" tone="soft" width="10.75rem" height="0.6875rem" :delay="delay(4)" />
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
                  <SkeletonBlock shape="circle" width="3rem" height="3rem" :delay="delay(row, 20)" />
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="5.5rem" height="0.875rem" :delay="delay(row, 60)" />
                    <SkeletonBlock shape="text" tone="soft" width="6.75rem" height="0.625rem" :delay="delay(row, 100)" />
                  </div>
                </div>
                <SkeletonBlock shape="text" tone="base" width="5.75rem" height="1.5rem" :delay="delay(row, 140)" />
              </div>
            </div>
          </div>
        </section>

        <section v-if="props.nettingRows > 0" class="space-y-6">
          <div class="skeleton-section-label">
            <SkeletonBlock shape="circle" tone="strong" width="0.375rem" height="0.375rem" :delay="delay(2)" />
            <SkeletonBlock shape="text" tone="soft" width="7rem" height="0.625rem" :delay="delay(3)" />
          </div>

          <div class="skeleton-shell" data-testid="skeleton-netting-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" :delay="delay(3)" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="10.25rem" height="1.125rem" :delay="delay(4)" />
                <SkeletonBlock shape="text" tone="soft" width="12rem" height="0.6875rem" :delay="delay(5)" />
              </div>
            </div>

            <div class="p-4 sm:p-6 grid gap-4">
              <div
                v-for="row in props.nettingRows"
                :key="`netting-${row}`"
                class="p-5 border border-stone bg-canvas rounded-2xl"
                data-testid="skeleton-netting-row"
              >
                <div class="flex flex-col gap-5">
                  <div class="flex items-start gap-4">
                    <SkeletonBlock shape="circle" tone="soft" width="3rem" height="3rem" :delay="delay(row, 60)" />
                    <div class="min-w-0 flex-1 space-y-2">
                      <SkeletonBlock shape="text" tone="base" width="75%" height="0.875rem" :delay="delay(row, 100)" />
                      <SkeletonBlock shape="text" tone="strong" width="6.25rem" height="1.875rem" :delay="delay(row, 140)" />
                    </div>
                  </div>
                  <SkeletonBlock tone="strong" width="100%" height="3rem" radius="0.75rem" :delay="delay(row, 180)" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-6">
          <div class="skeleton-section-label">
            <SkeletonBlock shape="circle" tone="strong" width="0.375rem" height="0.375rem" :delay="delay(3)" />
            <SkeletonBlock shape="text" tone="soft" width="6.5rem" height="0.625rem" :delay="delay(4)" />
          </div>

          <div class="skeleton-shell" data-testid="skeleton-fixed-bills-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" :delay="delay(4)" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="6.75rem" height="1.125rem" :delay="delay(5)" />
                <SkeletonBlock shape="text" tone="soft" width="7.75rem" height="0.6875rem" :delay="delay(6)" />
              </div>
            </div>

            <div class="p-4 sm:p-6 grid gap-3">
              <div
                v-for="row in props.fixedBillRows"
                :key="`fixed-bill-${row}`"
                class="flex items-center justify-between p-4 rounded-xl border border-stone bg-canvas"
                data-testid="skeleton-fixed-bill-row"
              >
                <div class="flex items-center gap-4 min-w-0 flex-1">
                  <SkeletonBlock width="2.5rem" height="2.5rem" radius="0.5rem" :delay="delay(row, 80)" />
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="7.25rem" height="0.875rem" :delay="delay(row, 120)" />
                    <SkeletonBlock shape="text" tone="soft" width="8.75rem" height="0.625rem" :delay="delay(row, 160)" />
                  </div>
                </div>
                <SkeletonBlock shape="circle" tone="soft" width="1.5rem" height="1.5rem" :delay="delay(row, 200)" />
              </div>

              <div class="flex flex-col items-center gap-2 mt-3">
                <div
                  class="w-full flex justify-center items-center gap-3 p-4 rounded-xl border border-dashed border-stone bg-canvas/50"
                  data-testid="skeleton-add-fixed-bill"
                >
                  <SkeletonBlock shape="circle" tone="soft" width="1rem" height="1rem" :delay="delay(8)" />
                  <SkeletonBlock shape="text" tone="soft" width="8.75rem" height="0.625rem" :delay="delay(9)" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-6">
          <div class="skeleton-section-label">
            <SkeletonBlock shape="circle" tone="soft" width="0.375rem" height="0.375rem" :delay="delay(4)" />
            <SkeletonBlock shape="text" tone="soft" width="6.25rem" height="0.625rem" :delay="delay(5)" />
          </div>

          <div class="skeleton-shell min-h-[400px] flex flex-col" data-testid="skeleton-activity-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" :delay="delay(5)" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="5.75rem" height="1.125rem" :delay="delay(6)" />
                <SkeletonBlock shape="text" tone="soft" width="10.75rem" height="0.6875rem" :delay="delay(7)" />
              </div>
            </div>

            <div class="p-4 sm:p-6 space-y-4 flex-1">
              <div
                v-for="row in props.activityRows"
                :key="`activity-${row}`"
                class="flex flex-col p-4 rounded-xl border border-stone bg-canvas space-y-4"
                data-testid="skeleton-activity-row"
              >
                <div class="flex justify-between items-start gap-4">
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="8.5rem" height="0.875rem" :delay="delay(row, 100)" />
                    <div class="flex items-center gap-2">
                      <SkeletonBlock shape="text" tone="base" width="3.5rem" height="1rem" radius="0.375rem" :delay="delay(row, 140)" />
                      <SkeletonBlock shape="text" tone="soft" width="6.25rem" height="0.625rem" :delay="delay(row, 180)" />
                    </div>
                  </div>
                  <SkeletonBlock shape="text" tone="strong" width="4.75rem" height="1.125rem" :delay="delay(row, 220)" />
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-stone">
                  <SkeletonBlock tone="base" width="5.25rem" height="2.25rem" radius="0.5rem" :delay="delay(row, 260)" />
                  <SkeletonBlock tone="soft" width="5.25rem" height="2.25rem" radius="0.5rem" :delay="delay(row, 300)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="space-y-12 pb-32">
        <div
          class="skeleton-shell mt-6 p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-canvas border-2 border-stone"
          data-testid="skeleton-period-status"
        >
          <div class="flex items-center gap-5 w-full">
            <SkeletonBlock width="3rem" height="3rem" radius="0.75rem" :delay="delay(1)" />
            <div class="space-y-2 w-full max-w-[25rem]">
              <SkeletonBlock shape="text" tone="strong" width="8.75rem" height="1.25rem" :delay="delay(2)" />
              <SkeletonBlock shape="text" tone="soft" width="100%" height="0.8125rem" :delay="delay(3)" />
              <SkeletonBlock shape="text" tone="soft" width="82%" height="0.8125rem" :delay="delay(4)" />
            </div>
          </div>
          <div class="w-full md:w-40 shrink-0">
            <SkeletonBlock tone="strong" width="100%" height="3rem" radius="0.75rem" :delay="delay(5)" />
          </div>
        </div>

        <section class="space-y-6">
          <div class="skeleton-section-label">
            <SkeletonBlock shape="circle" tone="strong" width="0.375rem" height="0.375rem" :delay="delay(2)" />
            <SkeletonBlock shape="text" tone="soft" width="6.5rem" height="0.625rem" :delay="delay(3)" />
          </div>

          <div class="skeleton-shell" data-testid="skeleton-breakdown-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" :delay="delay(3)" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="8.75rem" height="1.125rem" :delay="delay(4)" />
                <SkeletonBlock shape="text" tone="soft" width="12.5rem" height="0.6875rem" :delay="delay(5)" />
              </div>
            </div>

            <div class="p-4 sm:p-8 space-y-12">
              <div
                v-for="member in props.memberRows"
                :key="`member-breakdown-${member}`"
                class="space-y-6"
                data-testid="skeleton-member-breakdown"
              >
                <div class="flex justify-between items-center px-1 gap-4">
                  <div class="flex items-center gap-4">
                    <SkeletonBlock shape="circle" width="3.5rem" height="3.5rem" :delay="delay(member, 80)" />
                    <SkeletonBlock shape="text" tone="strong" width="7.5rem" height="1.625rem" :delay="delay(member, 120)" />
                  </div>
                  <SkeletonBlock shape="text" tone="base" width="7.25rem" height="2rem" radius="9999px" :delay="delay(member, 160)" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    v-for="summary in 3"
                    :key="`summary-${member}-${summary}`"
                    class="rounded-2xl bg-parchment p-5 shadow-subtle"
                    data-testid="skeleton-financial-summary"
                  >
                    <div class="flex items-center gap-3 mb-6">
                      <SkeletonBlock shape="circle" tone="base" width="2.25rem" height="2.25rem" :delay="delay(member + summary, 120)" />
                      <SkeletonBlock shape="text" tone="soft" width="5.5rem" height="0.625rem" :delay="delay(member + summary, 160)" />
                    </div>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center gap-3">
                        <SkeletonBlock shape="text" tone="soft" width="3.5rem" height="0.75rem" :delay="delay(member + summary, 200)" />
                        <SkeletonBlock shape="text" tone="strong" width="4.25rem" height="0.875rem" :delay="delay(member + summary, 240)" />
                      </div>
                      <div class="h-px w-full bg-stone" />
                      <div class="flex justify-between items-center gap-3">
                        <SkeletonBlock shape="text" tone="soft" width="3.5rem" height="0.75rem" :delay="delay(member + summary, 280)" />
                        <SkeletonBlock shape="text" tone="strong" width="4.25rem" height="0.875rem" :delay="delay(member + summary, 320)" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-center pt-2">
                  <SkeletonBlock tone="soft" width="11.5rem" height="2.5rem" radius="9999px" :delay="delay(member, 360)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skeleton-theme {
  --skeleton-base: rgb(73 87 80 / 13%);
  --skeleton-soft: rgb(73 87 80 / 8%);
  --skeleton-strong: rgb(73 87 80 / 20%);
  --skeleton-highlight: rgb(255 255 255 / 58%);
  --skeleton-duration: 1.8s;
  --skeleton-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

:global(.dark) .skeleton-theme {
  --skeleton-base: rgb(255 255 255 / 10%);
  --skeleton-soft: rgb(255 255 255 / 6%);
  --skeleton-strong: rgb(255 255 255 / 16%);
  --skeleton-highlight: rgb(255 255 255 / 12%);
}

.skeleton-shell {
  overflow: hidden;
  border-radius: 1rem;
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

.skeleton-section-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-inline: 0.25rem;
}

@media (min-width: 640px) {
  .skeleton-panel-header {
    padding: 1.75rem 1.5rem;
  }
}
</style>
