<script setup lang="ts">
import type { GeneratorDefinition } from '~/types/generator'

interface Props {
  generator: GeneratorDefinition
}
defineProps<Props>()
</script>

<template>
  <div>
    <header class="mb-6">
      <SectionLabel>{{ $t('generator.label') }}</SectionLabel>
      <h1 class="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text-primary)]">
        {{ $t(generator.titleKey) }}
      </h1>
      <p class="mt-1 text-sm text-[var(--color-text-muted)]">
        {{ $t(generator.descriptionKey) }}
      </p>
    </header>
    <slot />
  </div>
</template>
