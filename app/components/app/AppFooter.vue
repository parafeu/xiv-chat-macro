<script setup lang="ts">
const GITHUB_URL = 'https://github.com/parafeu/xiv-chat-macro'
</script>

<template>
  <footer class="border-t border-default/50 px-4 md:px-8 py-3 text-[11px] text-dimmed flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
    <span>{{ $t('app.brand') }}</span>
    <span aria-hidden="true" class="text-gold-dim/60">·</span>
    <a
      :href="GITHUB_URL"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1 hover:text-gold transition-colors"
    >
      <Icon name="i-lucide-github" class="size-3" />
      GitHub
    </a>
    <span aria-hidden="true" class="text-gold-dim/60">·</span>
    <span>{{ $t('footer.disclaimer') }}</span>
  </footer>
</template>
