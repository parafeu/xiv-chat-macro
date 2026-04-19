import { defineStore } from 'pinia'
import { FF14_DEFAULT_CHAT_COLOR_KEY, type Ff14ColorKey } from '~/constants/ff14Palette'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    /** Demo character identity shown inside the ChatPreview. */
    playerName: 'Parafeu Midia' as string,
    server: 'Louisoix' as string,
    /** Default chat message color — stored as an FF14 palette key (e.g. "r4c6"). */
    chatColor: FF14_DEFAULT_CHAT_COLOR_KEY as Ff14ColorKey,
  }),
  actions: {
    setPlayerName(value: string) {
      this.playerName = value
    },
    setServer(value: string) {
      this.server = value
    },
    setChatColor(key: Ff14ColorKey) {
      this.chatColor = key
    },
  },
  persist: true,
})
