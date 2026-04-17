<script setup lang="ts">
const { generators } = useGeneratorRegistry()
const settings = useSettingsStore()
const localePath = useLocalePath()
const route = useRoute()

function isActive(slug: string) {
  const current = typeof route.params.slug === 'string' ? route.params.slug : ''
  return current === slug
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col shrink-0 border-r border-[var(--color-border)] bg-black/20 transition-[width] duration-150"
    :class="settings.sidebarCollapsed ? 'w-16' : 'w-52'"
    aria-label="Primary navigation"
  >
    <div class="flex items-center justify-between px-3 pt-4 pb-2">
      <NuxtLink :to="localePath('/')" class="flex-1 text-center text-[var(--color-gold)] text-xl">
        ⚜
      </NuxtLink>
      <button
        type="button"
        class="ml-1 rounded p-1 text-[var(--color-text-dim)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
        :aria-label="settings.sidebarCollapsed ? $t('nav.expandSidebar') : $t('nav.collapseSidebar')"
        @click="settings.toggleSidebar()"
      >
        <Icon
          :name="settings.sidebarCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'"
          class="size-4"
        />
      </button>
    </div>
    <div v-if="!settings.sidebarCollapsed" class="px-2 pb-2">
      <OrnamentalDivider variant="short" />
    </div>

    <nav class="flex-1 px-2 space-y-0.5">
      <NuxtLink
        v-for="g in generators"
        :key="g.id"
        :to="localePath(`/${g.slug}`)"
        class="group flex items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold-soft)] hover:bg-[var(--color-bg-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
        :class="isActive(g.slug)
          ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold-soft)] border-l-2 border-[var(--color-gold)] pl-[6px]'
          : 'border-l-2 border-transparent'"
        :aria-current="isActive(g.slug) ? 'page' : undefined"
      >
        <Icon :name="g.icon" class="size-4 shrink-0" />
        <span v-if="!settings.sidebarCollapsed" class="truncate">
          {{ $t(g.titleKey) }}
        </span>
      </NuxtLink>
    </nav>

    <div class="px-2 pb-3">
      <div v-if="!settings.sidebarCollapsed" class="py-2">
        <OrnamentalDivider variant="short" />
      </div>
      <NuxtLink
        :to="localePath('/settings')"
        class="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-panel)]"
      >
        <Icon name="i-lucide-settings" class="size-4 shrink-0" />
        <span v-if="!settings.sidebarCollapsed">{{ $t('app.settings') }}</span>
      </NuxtLink>
    </div>
  </aside>
</template>
