<script setup lang="ts">
const { t } = useI18n()
const { current } = useGeneratorRegistry()

if (!current.value) {
  throw createError({ statusCode: 404, statusMessage: 'Generator not found', fatal: true })
}

const GeneratorComponent = defineAsyncComponent(async () => {
  const mod = await current.value!.component()
  return mod.default
})

useHead({
  title: () => current.value
    ? `${t(current.value.titleKey)} · ${t('app.brand')}`
    : t('app.brand'),
  meta: [{
    name: 'description',
    content: () => current.value ? t(current.value.descriptionKey) : '',
  }],
})
</script>

<template>
  <GeneratorShell v-if="current" :generator="current">
    <component :is="GeneratorComponent" />
  </GeneratorShell>
</template>
