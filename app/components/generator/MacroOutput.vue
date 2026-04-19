<script setup lang="ts">
/**
 * Shared output block for generators. Shows a monospace preview of the macro
 * lines and a Copy button that writes the joined text to the clipboard.
 *
 * Used by every generator — keep this generic (no per-generator labels or
 * shape knowledge).
 */
const props = defineProps<{
  /** Macro lines, one per chat message. Joined with \n for copy and preview. */
  lines: string[]
}>()

const macroText = computed(() => props.lines.join('\n'))
const { t } = useI18n()
const toast = useToast()

async function copy() {
  if (!macroText.value) return
  try {
    await navigator.clipboard.writeText(macroText.value)
    toast.add({ title: t('macro.copied'), color: 'primary', icon: 'i-lucide-check' })
  }
  catch {
    toast.add({ title: t('macro.copyFailed'), color: 'error', icon: 'i-lucide-triangle-alert' })
  }
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
        {{ $t('macro.title') }}
      </span>
      <UButton
        icon="i-lucide-copy"
        color="primary"
        variant="ghost"
        size="sm"
        :disabled="!lines.length"
        :label="$t('macro.copy')"
        @click="copy"
      />
    </div>
    <pre
      class="rounded-md border border-default bg-well p-4 font-mono text-[13px] leading-[1.4] text-toned whitespace-pre overflow-x-auto"
    >{{ lines.length ? macroText : '—' }}</pre>
  </div>
</template>
