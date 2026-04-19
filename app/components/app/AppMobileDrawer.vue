<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const { generators } = useGeneratorRegistry()
const localePath = useLocalePath()
const route = useRoute()

function isActive(slug: string) {
  const current = typeof route.params.slug === 'string' ? route.params.slug : ''
  return current === slug
}

const isHome = computed(() => route.path === localePath('/'))

function close() {
  open.value = false
}
</script>

<template>
  <USlideover v-model:open="open" side="left" :ui="{ content: 'max-w-64' }">
    <template #content>
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-default">
          <div class="flex items-baseline gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" class="h-6 w-auto shrink-0">
            <span class="font-[family-name:var(--font-display)] text-lg">{{ $t('app.brand') }}</span>
          </div>
          <button
            type="button"
            class="rounded p-1 text-dimmed hover:text-gold"
            :aria-label="$t('nav.closeMenu')"
            @click="close()"
          >
            <Icon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <NuxtLink
            :to="localePath('/')"
            class="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted hover:text-gold-soft hover:bg-panel"
            :class="isHome
              ? 'bg-gold/10 text-gold-soft'
              : ''"
            :aria-current="isHome ? 'page' : undefined"
            @click="close()"
          >
            <Icon name="i-lucide-home" class="size-4 shrink-0" />
            {{ $t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            v-for="g in generators"
            :key="g.id"
            :to="localePath(`/${g.slug}`)"
            class="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted hover:text-gold-soft hover:bg-panel"
            :class="isActive(g.slug)
              ? 'bg-gold/10 text-gold-soft'
              : ''"
            :aria-current="isActive(g.slug) ? 'page' : undefined"
            @click="close()"
          >
            <Icon :name="g.icon" class="size-4 shrink-0" />
            {{ $t(g.titleKey) }}
          </NuxtLink>
        </nav>
        <div class="border-t border-default px-2 py-3">
          <NuxtLink
            :to="localePath('/settings')"
            class="flex items-center gap-2 rounded px-3 py-2 text-xs text-dimmed hover:text-gold"
            @click="close()"
          >
            <Icon name="i-lucide-settings" class="size-4 shrink-0" />
            {{ $t('app.settings') }}
          </NuxtLink>
        </div>
      </div>
    </template>
  </USlideover>
</template>
