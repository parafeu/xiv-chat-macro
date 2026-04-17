import { useClipboard } from '@vueuse/core'

export function useMacroClipboard() {
  const { copy: rawCopy, isSupported } = useClipboard()
  const toast = useToast()
  const { t } = useI18n()

  async function copy(text: string) {
    await rawCopy(text)
    toast.add({
      title: t('macro.copied'),
      icon: 'i-lucide-check',
      color: 'success',
    })
  }

  return { copy, isSupported }
}
