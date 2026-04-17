import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    sidebarCollapsed: false as boolean,
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value
    },
  },
  persist: true,
})
