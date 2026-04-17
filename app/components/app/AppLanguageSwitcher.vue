<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const items = computed(() => (locales.value as { code: string, name: string }[]).map(l => ({
  label: l.name,
  to: switchLocalePath(l.code),
  active: l.code === locale.value,
})))
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-languages"
      :aria-label="$t('app.languageSwitcher')"
    >
      {{ locale.toUpperCase() }}
    </UButton>
  </UDropdownMenu>
</template>
