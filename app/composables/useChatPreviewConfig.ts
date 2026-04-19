import { storeToRefs } from 'pinia'

/**
 * Provides the full set of ChatPreview inputs:
 *   - `bgUrl`     — read from Nuxt runtime config (dev-time env var for the
 *                   licensed in-game screenshot that must stay out of git).
 *   - `playerName`, `server`, `chatColor` — read from the user settings store
 *                   (editable from the Settings page, persisted in localStorage).
 *
 * Returns refs. Consume by destructuring and passing individual props to
 * ChatPreview — refs auto-unwrap in template bindings.
 */
export function useChatPreviewConfig() {
  const config = useRuntimeConfig()
  const settings = useSettingsStore()
  const { playerName, server, chatColor } = storeToRefs(settings)

  return {
    bgUrl: config.public.chatPreviewBg as string,
    playerName,
    server,
    chatColor,
  }
}
