<script setup lang="ts">
const { generators } = useGeneratorRegistry()
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <aside
    class="hidden md:flex flex-col shrink-0 w-52 border-r border-default bg-black/20"
    aria-label="Primary navigation"
  >
    <nav class="flex-1 px-2 pt-4 space-y-0.5">
      <AppSidebarItem
        :to="localePath('/')"
        icon="i-lucide-home"
        :label="t('nav.home')"
      />
      <AppSidebarItem
        v-for="g in generators"
        :key="g.id"
        :to="localePath(`/${g.slug}`)"
        :icon="g.icon"
        :label="t(g.titleKey)"
      />
    </nav>

    <div class="px-2 pb-3">
      <div class="py-2">
        <OrnamentalDivider />
      </div>
      <AppSidebarItem
        :to="localePath('/settings')"
        icon="i-lucide-settings"
        :label="t('app.settings')"
      />
    </div>
  </aside>
</template>
