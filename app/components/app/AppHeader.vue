<script setup lang="ts">
defineProps<{
  /** Emits request to open the mobile drawer. */
  onOpenMenu?: () => void
}>()
</script>

<template>
  <header
    class="sticky top-0 z-20 bg-[var(--color-bg-base)]/85 backdrop-blur border-b border-[var(--color-border)]"
  >
    <div class="flex items-center justify-between px-4 md:px-6 py-3">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden inline-flex items-center justify-center rounded p-1.5 text-[var(--color-gold)] hover:bg-[var(--color-bg-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
          :aria-label="$t('nav.openMenu')"
          @click="onOpenMenu?.()"
        >
          <Icon name="i-lucide-menu" class="size-5" />
        </button>
        <div class="flex items-baseline gap-2">
          <span class="text-[var(--color-gold)] text-lg leading-none">⚜</span>
          <span class="font-[family-name:var(--font-display)] text-xl text-[var(--color-text-primary)]">
            {{ $t('app.brand') }}
          </span>
          <span
            class="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] ml-3"
          >
            {{ $t('app.subtitle') }}
          </span>
        </div>
      </div>
      <AppLanguageSwitcher />
    </div>
    <div class="pb-2">
      <OrnamentalDivider />
    </div>
  </header>
</template>
