<script setup lang="ts">
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'
import SectionLabel from './ui/SectionLabel.vue'
import { ArrowRight, Star } from 'lucide-vue-next'
</script>

<template>
  <div class="p-8 space-y-12 bg-background min-h-screen">
    <section class="space-y-4">
      <SectionLabel>Design System</SectionLabel>
      <h1 class="text-5xl font-display leading-tight">
        Minimalist <span class="gradient-text">Modern</span>
      </h1>
      <p class="text-muted-foreground max-w-md">
        Testando os novos componentes base e tokens de design.
      </p>
    </section>

    <section class="space-y-6">
      <h2 class="text-2xl font-semibold">Buttons</h2>
      <div class="flex flex-wrap gap-4 items-center">
        <Button variant="primary">
          Primary Button
          <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" size="lg">Large Action</Button>
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-2xl font-semibold">Cards</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card class="p-6">
          <h3 class="text-xl font-bold mb-2">Standard Card</h3>
          <p class="text-muted-foreground text-sm">
            Minimalista com bordas suaves e sombra moderada.
          </p>
        </Card>

        <Card variant="featured">
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-lg bg-gradient-to-br from-accent to-accent-secondary text-white">
              <Star class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">Featured Card</h3>
              <p class="text-muted-foreground text-sm">
                Borda em gradiente de 2px e sombra elevada.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>

    <section class="bg-foreground p-12 rounded-3xl space-y-6 relative overflow-hidden">
      <div class="absolute inset-0 dot-pattern" />
      <SectionLabel class="border-white/20 bg-white/5 text-white">
        <span class="bg-white"></span>
        Inverted Section
      </SectionLabel>
      <h2 class="text-4xl font-display text-white relative z-10">
        Contraste <span class="gradient-text">Dramático</span>
      </h2>
      <Button variant="inverted">Botão Invertido</Button>
    </section>
  </div>
</template>
