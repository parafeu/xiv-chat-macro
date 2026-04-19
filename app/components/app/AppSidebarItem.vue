<script setup lang="ts">
interface Props {
  /** Resolved localized path to navigate to (pass `localePath(...)` output). */
  to: string
  /** Lucide/Phosphor icon name (e.g. 'i-lucide-home'). */
  icon: string
  /** Visible text. */
  label: string
}
const props = defineProps<Props>()

const route = useRoute()
const active = computed(() => route.path === props.to)
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex items-center gap-2 rounded px-2 py-1.5 text-sm text-muted hover:text-gold-soft hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
    :class="active
      ? 'bg-gold/10 text-gold-soft border-l-2 border-gold pl-[6px]'
      : 'border-l-2 border-transparent'"
    :aria-current="active ? 'page' : undefined"
  >
    <Icon :name="icon" class="size-4 shrink-0" />
    <span class="truncate">{{ label }}</span>
  </NuxtLink>
</template>
