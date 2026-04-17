<script setup lang="ts">
const sampleLines = [
  '┏━━━━━━━━━━━━━━┓',
  '┃     EXAMPLE      ┃',
  '┃     PREVIEW      ┃',
  '┗━∩━━━━━━━━∩━┛',
  '    \\  (´･ω･｀)ﾉ',
]
</script>

<template>
  <div class="max-w-3xl">
    <GoldFrame class="mb-6">
      <div class="flex items-center gap-3">
        <Icon name="i-lucide-construction" class="size-5 text-[var(--color-gold)]" />
        <span class="text-sm text-[var(--color-text-muted)]">
          {{ $t('generator.comingSoon') }}
        </span>
      </div>
    </GoldFrame>
    <MacroPreview :lines="sampleLines" command="/p " />
  </div>
</template>
