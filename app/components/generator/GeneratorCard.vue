<script setup lang="ts">
import type { GeneratorDefinition } from '~/types/generator'

interface Props {
  generator: GeneratorDefinition
}
defineProps<Props>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/${generator.slug}`)"
    class="group relative block rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5 transition-colors hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/50 to-transparent"
    />
    <div class="mb-3 flex items-center justify-between">
      <Icon :name="generator.icon" class="size-6 text-[var(--color-gold)]" />
      <span
        v-if="generator.badge"
        class="rounded border border-[var(--color-border-strong)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--color-gold-soft)]"
      >
        {{ $t(`badges.${generator.badge}`) }}
      </span>
    </div>
    <h3 class="font-[family-name:var(--font-display)] text-lg text-[var(--color-text-primary)]">
      {{ $t(generator.titleKey) }}
    </h3>
    <p class="mt-1 text-sm text-[var(--color-text-muted)]">
      {{ $t(generator.descriptionKey) }}
    </p>
  </NuxtLink>
</template>
