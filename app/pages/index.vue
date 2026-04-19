<script setup lang="ts">
const { t } = useI18n()
const { generators } = useGeneratorRegistry()

useHead({
  title: () => `${t('home.title')} · ${t('app.brand')}`,
  meta: [{ name: 'description', content: () => t('home.description') }],
})
</script>

<template>
  <div>
    <SectionLabel>{{ $t('app.brand') }}</SectionLabel>
    <h1 class="text-3xl md:text-4xl text-highlighted">
      {{ $t('home.title') }}
    </h1>
    <p class="mt-2 text-sm text-muted max-w-xl">
      {{ $t('home.description') }}
    </p>
    <div class="my-6">
      <OrnamentalDivider />
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GeneratorCard
        v-for="g in generators"
        :key="g.id"
        :generator="g"
      />
    </div>
  </div>
</template>
