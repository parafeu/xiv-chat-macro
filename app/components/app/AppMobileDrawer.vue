<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const { generators } = useGeneratorRegistry()
const localePath = useLocalePath()
const route = useRoute()

function isActive(slug: string) {
  const current = typeof route.params.slug === 'string' ? route.params.slug : ''
  return current === slug
}

function close() {
  open.value = false
}
</script>

<template>
  <USlideover v-model:open="open" side="left" :ui="{ content: 'max-w-64 bg-[var(--color-bg-base)]' }">
    <template #content>
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div class="flex items-baseline gap-2">
            <span class="text-[var(--color-gold)]">⚜</span>
            <span class="font-[family-name:var(--font-display)] text-lg">{{ $t('app.brand') }}</span>
          </div>
          <button
            type="button"
            class="rounded p-1 text-[var(--color-text-dim)] hover:text-[var(--color-gold)]"
            :aria-label="$t('nav.closeMenu')"
            @click="close()"
          >
            <Icon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <NuxtLink
            v-for="g in generators"
            :key="g.id"
            :to="localePath(`/${g.slug}`)"
            class="flex items-center gap-2 rounded px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold-soft)] hover:bg-[var(--color-bg-panel)]"
            :class="isActive(g.slug)
              ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold-soft)]'
              : ''"
            :aria-current="isActive(g.slug) ? 'page' : undefined"
            @click="close()"
          >
            <Icon :name="g.icon" class="size-4 shrink-0" />
            {{ $t(g.titleKey) }}
          </NuxtLink>
        </nav>
        <div class="border-t border-[var(--color-border)] px-2 py-3">
          <NuxtLink
            :to="localePath('/settings')"
            class="flex items-center gap-2 rounded px-3 py-2 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-gold)]"
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
