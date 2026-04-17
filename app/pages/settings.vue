<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: () => `${t('app.settings')} · ${t('app.brand')}`,
})
</script>

<template>
  <div class="max-w-2xl">
    <SectionLabel>{{ $t('app.settings') }}</SectionLabel>
    <h1 class="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text-primary)]">
      {{ $t('app.settings') }}
    </h1>
    <div class="my-6">
      <OrnamentalDivider variant="short" />
    </div>
    <GoldFrame>
      <p class="text-sm text-[var(--color-text-muted)]">
        {{ $t('generator.comingSoon') }}
      </p>
    </GoldFrame>
  </div>
</template>
