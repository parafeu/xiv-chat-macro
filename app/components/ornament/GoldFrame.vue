<script setup lang="ts">
interface Props {
  padded?: boolean
}
withDefaults(defineProps<Props>(), { padded: true })
</script>

<template>
  <div
    class="relative rounded-md border border-default bg-panel"
    :class="padded ? 'p-4' : ''"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
    />
    <slot />
  </div>
</template>
