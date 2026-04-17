<script setup lang="ts">
interface Props {
  variant?: 'full' | 'short'
}
const props = withDefaults(defineProps<Props>(), { variant: 'full' })
const glyph = computed(() => props.variant === 'full'
  ? '✦ ─── ✦ ─── ✦'
  : '─────────')
</script>

<template>
  <div
    role="separator"
    aria-hidden="true"
    class="text-center text-[10px] tracking-[0.25em] text-[var(--color-gold)] select-none"
  >
    {{ glyph }}
  </div>
</template>
