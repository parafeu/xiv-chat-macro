import type { Component } from 'vue'

export interface GeneratorDefinition {
  /** Stable identifier, e.g. 'alert-box'. Used for i18n keys and logs. */
  id: string
  /** URL segment, e.g. 'alert'. Must be unique and URL-safe. */
  slug: string
  /** Sidebar and home ordering (ascending). */
  order: number
  /** Icon name resolved by `@nuxt/icon`, e.g. 'i-lucide-sparkles'. */
  icon: string
  /** i18n key for the title (e.g. sidebar item, page heading). */
  titleKey: string
  /** i18n key for the short description (home card). */
  descriptionKey: string
  /** Lazy-loaded Vue component. */
  component: () => Promise<{ default: Component }>
  /** Optional visual badge. */
  badge?: 'new' | 'beta'
}
