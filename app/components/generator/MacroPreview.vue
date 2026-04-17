<script setup lang="ts">
interface Props {
  /** Lines of the preview as they will appear in-game (without the chat command prefix). */
  lines: string[]
  /** Optional chat-command prefix to prepend to each line when copied (e.g. '/p '). */
  command?: string
}
const props = withDefaults(defineProps<Props>(), { command: '' })

const linesRef = toRef(() => props.lines)
const { validation, MAX_LINES, MAX_CHARS_PER_LINE } = useMacroValidator(linesRef)
const { copy } = useMacroClipboard()
const { t } = useI18n()

const joined = computed(() => props.lines.join('\n'))
const macroOutput = computed(() => props.lines
  .map(l => props.command ? `${props.command}${l}` : l)
  .join('\n'))

async function onCopy() {
  await copy(macroOutput.value)
}
</script>

<template>
  <div>
    <SectionLabel>{{ $t('preview.label') }}</SectionLabel>
    <div
      class="relative rounded-md border border-[var(--color-border-strong)] bg-[#060810] p-4 font-mono text-sm leading-relaxed text-[var(--color-text-body)] whitespace-pre"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/50 to-transparent"
      />
      {{ joined }}
    </div>

    <div
      class="mt-2 flex items-center justify-between rounded border border-[var(--color-border)] bg-black/20 px-3 py-2 text-[11px] text-[var(--color-text-muted)]"
    >
      <span>
        {{ t('preview.status.lines', { current: validation.lineCount }) }}
        ·
        {{ t('preview.status.chars', { max: validation.maxCharCount }) }}
      </span>
      <span
        :class="validation.isValid
          ? 'text-[var(--color-success)]'
          : 'text-[var(--color-danger)]'"
      >
        {{ validation.isValid ? t('preview.status.valid') : t('preview.status.invalid') }}
      </span>
    </div>

    <div class="mt-3 flex gap-2">
      <UButton
        color="primary"
        variant="solid"
        icon="i-lucide-clipboard-copy"
        :disabled="!validation.isValid"
        @click="onCopy"
      >
        {{ t('macro.copy') }}
      </UButton>
    </div>

    <!-- silence the unused-vars lint: these constants document the FF14 limits -->
    <span hidden>{{ MAX_LINES }}{{ MAX_CHARS_PER_LINE }}</span>
  </div>
</template>
