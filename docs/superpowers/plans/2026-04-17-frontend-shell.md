# Frontend shell implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Nuxt 4 frontend shell for a FF14 chat macro generator — themed V2 "modern FF14" dark UI, sidebar nav, i18n (EN default, FR), Pinia settings store, and a registry architecture so new generators are added by dropping a folder under `app/generators/`. V1 ships a placeholder generator (`example`) only; real generators come later.

**Architecture:** A `default` layout renders `AppHeader` + `AppSidebar` + `<NuxtPage>`. The home page is a grid of cards built from a registry of `GeneratorDefinition` entries aggregated with `import.meta.glob`. A dynamic `[slug].vue` route lazy-loads the matching generator component. Shared composables (`useGeneratorRegistry`, `useMacroValidator`, `useMacroClipboard`) live in `app/composables/`. Theming is driven by CSS custom properties in `main.css` wired through `@nuxt/ui` v3 and Tailwind v4.

**Tech Stack:** Nuxt 4, TypeScript, `@nuxt/ui` v3 (Tailwind v4), `@nuxt/icon`, `@nuxt/a11y`, `@nuxt/fonts`, `@nuxtjs/i18n`, `@pinia/nuxt` + `pinia-plugin-persistedstate`, `@vueuse/nuxt`.

**Notes about testing:** The approved spec defers all automated tests to a later phase — the first real generator will own `useMacroValidator` tests. V1 verification is manual: `npx nuxi prepare` + `npm run dev` smoke check + QA checklist at the end. Each task ends with a commit once its manual verification passes.

---

## File Structure

Files created/modified by this plan, and what each owns:

- `package.json` — new dependencies added (modules + VueUse + Pinia persisted state)
- `nuxt.config.ts` — module list, i18n config, css entry, runtime hints
- `app.config.ts` — `@nuxt/ui` theme (`primary: 'gold'`)
- `app/assets/css/main.css` — Tailwind + `@nuxt/ui` import, CSS variable tokens, font declarations, base styles
- `app/types/generator.ts` — `GeneratorDefinition` interface
- `app/generators/registry.ts` — `import.meta.glob` aggregator + `findBySlug`
- `app/generators/README.md` — "how to add a generator" docs
- `app/generators/example/index.ts` + `app/generators/example/Generator.vue` — placeholder generator
- `app/composables/useGeneratorRegistry.ts` — computed access to the registry
- `app/composables/useMacroValidator.ts` — validation for 15 lines × 180 chars
- `app/composables/useMacroClipboard.ts` — `useClipboard` wrapper with toast
- `app/stores/settings.ts` — Pinia `useSettingsStore` (sidebar collapsed, locale mirror)
- `i18n/i18n.config.ts` + `i18n/locales/en.json` + `i18n/locales/fr.json` — locales
- `app/components/ornament/OrnamentalDivider.vue`, `GoldFrame.vue`, `SectionLabel.vue` — ornament primitives
- `app/components/generator/GeneratorCard.vue`, `GeneratorShell.vue`, `MacroPreview.vue` — shared generator UI
- `app/components/app/AppHeader.vue`, `AppLanguageSwitcher.vue`, `AppSidebar.vue`, `AppMobileDrawer.vue` — shell components
- `app/layouts/default.vue` — layout wiring
- `app/app.vue` — replaces welcome scaffold with `<NuxtLayout><NuxtPage /></NuxtLayout>`
- `app/pages/index.vue` — home grid
- `app/pages/[slug].vue` — dynamic generator route
- `app/pages/settings.vue` — placeholder settings page
- `app/error.vue` — styled 404/500

---

## Task 1: Install dependencies and wire modules

**Files:**
- Modify: `package.json` (auto-updated by npm)
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Install runtime dependencies**

Run from `/home/alex/Dev/xiv-chat-macro`:

```bash
npm install @nuxt/ui @nuxt/fonts @nuxtjs/i18n @pinia/nuxt pinia pinia-plugin-persistedstate @vueuse/nuxt @vueuse/core
```

Expected: `package.json` gets the new entries; `package-lock.json` updates. No errors.

- [ ] **Step 2: Update `nuxt.config.ts`**

Replace the entire file contents with:

```ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxt/a11y',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },

  icon: {
    serverBundle: {
      collections: ['lucide', 'ph'],
    },
  },

  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en', class: 'dark' },
      title: 'Macro Forge',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
```

- [ ] **Step 3: Run `nuxi prepare` to sanity-check the config**

Run: `npx nuxi prepare`

Expected: completes without errors and regenerates `.nuxt/`. If it complains about missing `assets/css/main.css`, that is expected — the file is created in Task 2. Proceed anyway; the config is valid.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json nuxt.config.ts
git commit -m "chore: install Nuxt modules (ui, fonts, i18n, pinia, vueuse)"
```

---

## Task 2: Design tokens, fonts, and base CSS

**Files:**
- Create: `app/assets/css/main.css`

- [ ] **Step 1: Create the tokens file**

Create `app/assets/css/main.css`:

```css
@import "tailwindcss";
@import "@nuxt/ui";

/* --- Custom gold scale for @nuxt/ui's `primary: 'gold'` config. -------- */
/* Generated manually from the brand gold #c9a962, kept tight at midpoint. */
@theme static {
  --color-gold-50:  #fbf5e4;
  --color-gold-100: #f3e6c3;
  --color-gold-200: #e8d39b;
  --color-gold-300: #dcbd72;
  --color-gold-400: #d0ab55;
  --color-gold-500: #c9a962;
  --color-gold-600: #a88947;
  --color-gold-700: #816835;
  --color-gold-800: #5a4925;
  --color-gold-900: #3a2f18;
  --color-gold-950: #1f1a0e;

  --font-display: "Cormorant Garamond", ui-serif, Georgia, serif;
  --font-sans:    "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

/* --- Semantic tokens used across the app. ------------------------------ */
:root {
  --color-bg-base: #0b0e16;
  --color-bg-deep: #121624;
  --color-bg-panel: rgba(201, 169, 98, 0.04);
  --color-bg-input: rgba(0, 0, 0, 0.25);

  --color-gold:         #c9a962;
  --color-gold-soft:    #d4b877;
  --color-gold-bright:  #e8d9a8;
  --color-gold-dim:     #8b7355;

  --color-border:        rgba(201, 169, 98, 0.18);
  --color-border-strong: rgba(201, 169, 98, 0.30);

  --color-text-primary: #f5f2e8;
  --color-text-body:    #e8e6df;
  --color-text-muted:   #a8a69c;
  --color-text-dim:     #6b6a63;

  --color-success: #7dd87d;
  --color-warning: #d4b877;
  --color-danger:  #d87d7d;
}

html, body {
  min-height: 100%;
  background: linear-gradient(180deg, var(--color-bg-base) 0%, var(--color-bg-deep) 100%);
  background-attachment: fixed;
  color: var(--color-text-body);
  font-family: var(--font-sans);
  font-feature-settings: "cv11", "ss01";
}

/* Default display font for headings. Individual components can opt in via
   the `font-display` Tailwind utility generated from --font-display. */
h1, h2, h3 {
  font-family: var(--font-display);
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

/* Reduced-motion users never see gradient/glow animations. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Scrollbar styling so the dark theme stays consistent. */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-gold-dim);
  border-radius: 5px;
  opacity: 0.4;
}
::-webkit-scrollbar-thumb:hover { background: var(--color-gold); }
```

- [ ] **Step 2: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 3: Start dev server briefly to confirm it boots**

Run: `timeout 15 npm run dev || true`

Expected: logs show "Nuxt v4.x.x" and the server listening on 3000. It is fine if the timeout kills it — we only want to confirm it boots. If it exits with an error before the timeout, read the error and fix it.

- [ ] **Step 4: Commit**

```bash
git add app/assets/css/main.css
git commit -m "feat(theme): add design tokens, gold scale, and base CSS"
```

---

## Task 3: Nuxt UI theme configuration

**Files:**
- Create: `app.config.ts`

- [ ] **Step 1: Create `app.config.ts` at the project root**

Path: `/home/alex/Dev/xiv-chat-macro/app.config.ts`

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'gold',
      neutral: 'zinc',
    },
    button: {
      defaultVariants: {
        color: 'primary',
      },
    },
    card: {
      slots: {
        root: 'bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-md',
      },
    },
    input: {
      slots: {
        base: 'bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-dim)]',
      },
    },
  },
})
```

- [ ] **Step 2: Run `nuxi prepare` to verify the config is valid**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app.config.ts
git commit -m "feat(theme): configure @nuxt/ui with gold primary and panel styling"
```

---

## Task 4: Generator type contract and registry

**Files:**
- Create: `app/types/generator.ts`
- Create: `app/generators/registry.ts`
- Create: `app/generators/README.md`

- [ ] **Step 1: Create `app/types/generator.ts`**

```ts
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
```

- [ ] **Step 2: Create `app/generators/registry.ts`**

```ts
import type { GeneratorDefinition } from '~/types/generator'

const modules = import.meta.glob<{ default: GeneratorDefinition }>(
  './*/index.ts',
  { eager: true },
)

export const generators: GeneratorDefinition[] = Object
  .values(modules)
  .map(m => m.default)
  .sort((a, b) => a.order - b.order)

export function findBySlug(slug: string): GeneratorDefinition | undefined {
  return generators.find(g => g.slug === slug)
}
```

- [ ] **Step 3: Create `app/generators/README.md`**

```markdown
# Generators

Each subfolder here is one generator. The app picks them up automatically — the sidebar, the home grid, and the `/[slug]` route all iterate over `registry.ts`.

## How to add a generator

1. Create a folder: `app/generators/my-generator/`
2. Add `index.ts` exporting a default `GeneratorDefinition`:

   ```ts
   import type { GeneratorDefinition } from '~/types/generator'

   export default {
     id: 'my-generator',
     slug: 'my-generator',
     order: 10,
     icon: 'i-lucide-square-code',
     titleKey: 'generators.myGenerator.title',
     descriptionKey: 'generators.myGenerator.description',
     component: () => import('./Generator.vue'),
   } satisfies GeneratorDefinition
   ```

3. Add `Generator.vue` with your UI and logic.
4. Add matching i18n keys to `i18n/locales/en.json` and `fr.json`.

That is all. No shell code changes required.
```

- [ ] **Step 4: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors. (The glob currently matches zero files — the registry is just empty. That is fine.)

- [ ] **Step 5: Commit**

```bash
git add app/types/generator.ts app/generators/registry.ts app/generators/README.md
git commit -m "feat(registry): add generator contract and registry aggregator"
```

---

## Task 5: i18n locales and config

**Files:**
- Create: `i18n/i18n.config.ts`
- Create: `i18n/locales/en.json`
- Create: `i18n/locales/fr.json`

- [ ] **Step 1: Create `i18n/i18n.config.ts`**

```ts
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
}))
```

- [ ] **Step 2: Create `i18n/locales/en.json`**

```json
{
  "app": {
    "brand": "Macro Forge",
    "subtitle": "Chat macro generator",
    "settings": "Settings",
    "languageSwitcher": "Language"
  },
  "nav": {
    "home": "Home",
    "collapseSidebar": "Collapse sidebar",
    "expandSidebar": "Expand sidebar",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },
  "home": {
    "title": "Generators",
    "description": "Pick a forge to craft your chat macros."
  },
  "generator": {
    "label": "GENERATOR",
    "comingSoon": "Coming soon"
  },
  "preview": {
    "label": "Live preview",
    "status": {
      "valid": "Valid for FF14",
      "invalid": "Exceeds macro limits",
      "lines": "{current} / 15 lines",
      "chars": "max {max} / 180 chars"
    }
  },
  "macro": {
    "copy": "Copy macro",
    "copied": "Copied to clipboard"
  },
  "error": {
    "notFound": {
      "title": "Page not found",
      "description": "The generator you seek is not in the registry.",
      "action": "Back to home"
    },
    "generic": {
      "title": "Something went wrong",
      "action": "Back to home"
    }
  },
  "badges": {
    "new": "NEW",
    "beta": "BETA"
  },
  "generators": {
    "example": {
      "title": "Example",
      "description": "Placeholder generator — scaffold only."
    }
  }
}
```

- [ ] **Step 3: Create `i18n/locales/fr.json`**

```json
{
  "app": {
    "brand": "Macro Forge",
    "subtitle": "Générateur de macros de chat",
    "settings": "Réglages",
    "languageSwitcher": "Langue"
  },
  "nav": {
    "home": "Accueil",
    "collapseSidebar": "Replier la barre latérale",
    "expandSidebar": "Déplier la barre latérale",
    "openMenu": "Ouvrir le menu",
    "closeMenu": "Fermer le menu"
  },
  "home": {
    "title": "Générateurs",
    "description": "Choisis une forge pour créer tes macros de chat."
  },
  "generator": {
    "label": "GÉNÉRATEUR",
    "comingSoon": "Bientôt disponible"
  },
  "preview": {
    "label": "Aperçu live",
    "status": {
      "valid": "Valide pour FF14",
      "invalid": "Dépasse les limites macro",
      "lines": "{current} / 15 lignes",
      "chars": "max {max} / 180 caractères"
    }
  },
  "macro": {
    "copy": "Copier la macro",
    "copied": "Copié dans le presse-papier"
  },
  "error": {
    "notFound": {
      "title": "Page introuvable",
      "description": "Le générateur demandé n'est pas dans le registre.",
      "action": "Retour à l'accueil"
    },
    "generic": {
      "title": "Un problème est survenu",
      "action": "Retour à l'accueil"
    }
  },
  "badges": {
    "new": "NOUVEAU",
    "beta": "BÊTA"
  },
  "generators": {
    "example": {
      "title": "Exemple",
      "description": "Générateur de démo — structure seule."
    }
  }
}
```

- [ ] **Step 4: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors. `@nuxtjs/i18n` picks up both locale files.

- [ ] **Step 5: Commit**

```bash
git add i18n/
git commit -m "feat(i18n): add EN and FR locales and i18n config"
```

---

## Task 6: Pinia settings store

**Files:**
- Create: `app/stores/settings.ts`
- Modify: `nuxt.config.ts` (add persistedstate plugin registration)

- [ ] **Step 1: Create `app/stores/settings.ts`**

```ts
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
```

- [ ] **Step 2: Register the persistedstate plugin**

Create `app/plugins/pinia-persistedstate.client.ts`:

```ts
import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$pinia.use(createPersistedState({
    storage: localStorage,
  }))
})
```

- [ ] **Step 3: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/stores/settings.ts app/plugins/pinia-persistedstate.client.ts
git commit -m "feat(state): add Pinia settings store with localStorage persistence"
```

---

## Task 7: Shared composables

**Files:**
- Create: `app/composables/useGeneratorRegistry.ts`
- Create: `app/composables/useMacroValidator.ts`
- Create: `app/composables/useMacroClipboard.ts`

- [ ] **Step 1: Create `app/composables/useGeneratorRegistry.ts`**

```ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { generators, findBySlug } from '~/generators/registry'
import type { GeneratorDefinition } from '~/types/generator'

export function useGeneratorRegistry() {
  const route = useRoute()

  const current = computed<GeneratorDefinition | undefined>(() => {
    const slug = typeof route.params.slug === 'string'
      ? route.params.slug
      : undefined
    return slug ? findBySlug(slug) : undefined
  })

  return {
    generators,
    findBySlug,
    current,
  }
}
```

- [ ] **Step 2: Create `app/composables/useMacroValidator.ts`**

```ts
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

const MAX_LINES = 15
const MAX_CHARS_PER_LINE = 180

export interface MacroValidation {
  lineCount: number
  charCounts: number[]
  maxCharCount: number
  isValid: boolean
  warnings: string[]
}

export function useMacroValidator(lines: MaybeRefOrGetter<string[]>) {
  const validation = computed<MacroValidation>(() => {
    const rawLines = toValue(lines)
    const lineCount = rawLines.length
    const charCounts = rawLines.map(l => l.length)
    const maxCharCount = charCounts.length > 0 ? Math.max(...charCounts) : 0
    const warnings: string[] = []

    if (lineCount > MAX_LINES) {
      warnings.push(`Too many lines: ${lineCount} / ${MAX_LINES}`)
    }
    const overLongLines = charCounts.filter(c => c > MAX_CHARS_PER_LINE).length
    if (overLongLines > 0) {
      warnings.push(`${overLongLines} line(s) exceed ${MAX_CHARS_PER_LINE} characters`)
    }

    return {
      lineCount,
      charCounts,
      maxCharCount,
      isValid: warnings.length === 0,
      warnings,
    }
  })

  return {
    validation,
    MAX_LINES,
    MAX_CHARS_PER_LINE,
  }
}
```

- [ ] **Step 3: Create `app/composables/useMacroClipboard.ts`**

```ts
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
```

- [ ] **Step 4: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors. Auto-imports pick up the three composables.

- [ ] **Step 5: Commit**

```bash
git add app/composables/
git commit -m "feat(composables): add registry, macro validator, and clipboard helpers"
```

---

## Task 8: Ornament primitives

**Files:**
- Create: `app/components/ornament/OrnamentalDivider.vue`
- Create: `app/components/ornament/GoldFrame.vue`
- Create: `app/components/ornament/SectionLabel.vue`

- [ ] **Step 1: Create `OrnamentalDivider.vue`**

```vue
<script setup lang="ts">
interface Props {
  variant?: 'full' | 'short'
}
const props = withDefaults(defineProps<Props>(), { variant: 'full' })
const glyph = computed(() => props.variant === 'full'
  ? '✦ ─── ✦ ─── ✦'
  : '─────────')
</script>

<template>
  <div
    role="separator"
    aria-hidden="true"
    class="text-center text-[10px] tracking-[0.25em] text-[var(--color-gold)] select-none"
  >
    {{ glyph }}
  </div>
</template>
```

- [ ] **Step 2: Create `GoldFrame.vue`**

```vue
<script setup lang="ts">
interface Props {
  padded?: boolean
}
withDefaults(defineProps<Props>(), { padded: true })
</script>

<template>
  <div
    class="relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)]"
    :class="padded ? 'p-4' : ''"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/50 to-transparent"
    />
    <slot />
  </div>
</template>
```

- [ ] **Step 3: Create `SectionLabel.vue`**

```vue
<template>
  <div
    class="text-[9px] font-medium uppercase tracking-[0.25em] text-[var(--color-gold)] mb-2"
  >
    <slot />
  </div>
</template>
```

- [ ] **Step 4: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors. Components auto-import with path-derived names: `OrnamentOrnamentalDivider`? No — by default `@nuxt/ui` and Nuxt's component auto-import flatten the path. The files resolve to `<OrnamentalDivider>`, `<GoldFrame>`, `<SectionLabel>` thanks to Nuxt's `pathPrefix: false` default in `app/components/`.

- [ ] **Step 5: Commit**

```bash
git add app/components/ornament/
git commit -m "feat(ui): add ornamental divider, gold frame, and section label"
```

---

## Task 9: Shared generator components

**Files:**
- Create: `app/components/generator/GeneratorCard.vue`
- Create: `app/components/generator/GeneratorShell.vue`
- Create: `app/components/generator/MacroPreview.vue`

- [ ] **Step 1: Create `GeneratorCard.vue`**

```vue
<script setup lang="ts">
import type { GeneratorDefinition } from '~/types/generator'

interface Props {
  generator: GeneratorDefinition
}
defineProps<Props>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/${generator.slug}`)"
    class="group relative block rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5 transition-colors hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/50 to-transparent"
    />
    <div class="mb-3 flex items-center justify-between">
      <Icon :name="generator.icon" class="size-6 text-[var(--color-gold)]" />
      <span
        v-if="generator.badge"
        class="rounded border border-[var(--color-border-strong)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--color-gold-soft)]"
      >
        {{ $t(`badges.${generator.badge}`) }}
      </span>
    </div>
    <h3 class="font-[family-name:var(--font-display)] text-lg text-[var(--color-text-primary)]">
      {{ $t(generator.titleKey) }}
    </h3>
    <p class="mt-1 text-sm text-[var(--color-text-muted)]">
      {{ $t(generator.descriptionKey) }}
    </p>
  </NuxtLink>
</template>
```

- [ ] **Step 2: Create `GeneratorShell.vue`**

```vue
<script setup lang="ts">
import type { GeneratorDefinition } from '~/types/generator'

interface Props {
  generator: GeneratorDefinition
}
defineProps<Props>()
</script>

<template>
  <div>
    <header class="mb-6">
      <SectionLabel>{{ $t('generator.label') }}</SectionLabel>
      <h1 class="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text-primary)]">
        {{ $t(generator.titleKey) }}
      </h1>
      <p class="mt-1 text-sm text-[var(--color-text-muted)]">
        {{ $t(generator.descriptionKey) }}
      </p>
    </header>
    <slot />
  </div>
</template>
```

- [ ] **Step 3: Create `MacroPreview.vue`**

```vue
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
```

- [ ] **Step 4: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/generator/
git commit -m "feat(ui): add generator card, shell wrapper, and macro preview"
```

---

## Task 10: Example placeholder generator

**Files:**
- Create: `app/generators/example/index.ts`
- Create: `app/generators/example/Generator.vue`

- [ ] **Step 1: Create `app/generators/example/index.ts`**

```ts
import type { GeneratorDefinition } from '~/types/generator'

export default {
  id: 'example',
  slug: 'example',
  order: 0,
  icon: 'i-lucide-sparkles',
  titleKey: 'generators.example.title',
  descriptionKey: 'generators.example.description',
  component: () => import('./Generator.vue'),
} satisfies GeneratorDefinition
```

- [ ] **Step 2: Create `app/generators/example/Generator.vue`**

```vue
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
```

- [ ] **Step 3: Run `nuxi prepare` to confirm the registry now has one entry**

Run: `npx nuxi prepare`

Expected: no errors. The registry glob now matches `example/index.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/generators/example/
git commit -m "feat(generators): add placeholder example generator"
```

---

## Task 11: Language switcher and header

**Files:**
- Create: `app/components/app/AppLanguageSwitcher.vue`
- Create: `app/components/app/AppHeader.vue`

- [ ] **Step 1: Create `AppLanguageSwitcher.vue`**

```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const items = computed(() => (locales.value as { code: string, name: string }[]).map(l => ({
  label: l.name,
  to: switchLocalePath(l.code),
  active: l.code === locale.value,
})))
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-languages"
      :aria-label="$t('app.languageSwitcher')"
    >
      {{ locale.toUpperCase() }}
    </UButton>
  </UDropdownMenu>
</template>
```

- [ ] **Step 2: Create `AppHeader.vue`**

```vue
<script setup lang="ts">
defineProps<{
  /** Emits request to open the mobile drawer. */
  onOpenMenu?: () => void
}>()
</script>

<template>
  <header
    class="sticky top-0 z-20 bg-[var(--color-bg-base)]/85 backdrop-blur border-b border-[var(--color-border)]"
  >
    <div class="flex items-center justify-between px-4 md:px-6 py-3">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden inline-flex items-center justify-center rounded p-1.5 text-[var(--color-gold)] hover:bg-[var(--color-bg-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
          :aria-label="$t('nav.openMenu')"
          @click="onOpenMenu?.()"
        >
          <Icon name="i-lucide-menu" class="size-5" />
        </button>
        <div class="flex items-baseline gap-2">
          <span class="text-[var(--color-gold)] text-lg leading-none">⚜</span>
          <span class="font-[family-name:var(--font-display)] text-xl text-[var(--color-text-primary)]">
            {{ $t('app.brand') }}
          </span>
          <span
            class="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] ml-3"
          >
            {{ $t('app.subtitle') }}
          </span>
        </div>
      </div>
      <AppLanguageSwitcher />
    </div>
    <div class="pb-2">
      <OrnamentalDivider />
    </div>
  </header>
</template>
```

- [ ] **Step 3: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/app/AppLanguageSwitcher.vue app/components/app/AppHeader.vue
git commit -m "feat(shell): add app header and language switcher"
```

---

## Task 12: Sidebar and mobile drawer

**Files:**
- Create: `app/components/app/AppSidebar.vue`
- Create: `app/components/app/AppMobileDrawer.vue`

- [ ] **Step 1: Create `AppSidebar.vue`**

```vue
<script setup lang="ts">
const { generators } = useGeneratorRegistry()
const settings = useSettingsStore()
const localePath = useLocalePath()
const route = useRoute()

function isActive(slug: string) {
  const current = typeof route.params.slug === 'string' ? route.params.slug : ''
  return current === slug
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col shrink-0 border-r border-[var(--color-border)] bg-black/20 transition-[width] duration-150"
    :class="settings.sidebarCollapsed ? 'w-16' : 'w-52'"
    aria-label="Primary navigation"
  >
    <div class="flex items-center justify-between px-3 pt-4 pb-2">
      <NuxtLink :to="localePath('/')" class="flex-1 text-center text-[var(--color-gold)] text-xl">
        ⚜
      </NuxtLink>
      <button
        type="button"
        class="ml-1 rounded p-1 text-[var(--color-text-dim)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
        :aria-label="settings.sidebarCollapsed ? $t('nav.expandSidebar') : $t('nav.collapseSidebar')"
        @click="settings.toggleSidebar()"
      >
        <Icon
          :name="settings.sidebarCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'"
          class="size-4"
        />
      </button>
    </div>
    <div v-if="!settings.sidebarCollapsed" class="px-2 pb-2">
      <OrnamentalDivider variant="short" />
    </div>

    <nav class="flex-1 px-2 space-y-0.5">
      <NuxtLink
        v-for="g in generators"
        :key="g.id"
        :to="localePath(`/${g.slug}`)"
        class="group flex items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold-soft)] hover:bg-[var(--color-bg-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
        :class="isActive(g.slug)
          ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold-soft)] border-l-2 border-[var(--color-gold)] pl-[6px]'
          : 'border-l-2 border-transparent'"
        :aria-current="isActive(g.slug) ? 'page' : undefined"
      >
        <Icon :name="g.icon" class="size-4 shrink-0" />
        <span v-if="!settings.sidebarCollapsed" class="truncate">
          {{ $t(g.titleKey) }}
        </span>
      </NuxtLink>
    </nav>

    <div class="px-2 pb-3">
      <div v-if="!settings.sidebarCollapsed" class="py-2">
        <OrnamentalDivider variant="short" />
      </div>
      <NuxtLink
        :to="localePath('/settings')"
        class="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-panel)]"
      >
        <Icon name="i-lucide-settings" class="size-4 shrink-0" />
        <span v-if="!settings.sidebarCollapsed">{{ $t('app.settings') }}</span>
      </NuxtLink>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Create `AppMobileDrawer.vue`**

```vue
<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const { generators } = useGeneratorRegistry()
const localePath = useLocalePath()
const route = useRoute()

function isActive(slug: string) {
  const current = typeof route.params.slug === 'string' ? route.params.slug : ''
  return current === slug
}

function close() {
  open.value = false
}
</script>

<template>
  <USlideover v-model:open="open" side="left" :ui="{ content: 'max-w-64 bg-[var(--color-bg-base)]' }">
    <template #content>
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div class="flex items-baseline gap-2">
            <span class="text-[var(--color-gold)]">⚜</span>
            <span class="font-[family-name:var(--font-display)] text-lg">{{ $t('app.brand') }}</span>
          </div>
          <button
            type="button"
            class="rounded p-1 text-[var(--color-text-dim)] hover:text-[var(--color-gold)]"
            :aria-label="$t('nav.closeMenu')"
            @click="close()"
          >
            <Icon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <NuxtLink
            v-for="g in generators"
            :key="g.id"
            :to="localePath(`/${g.slug}`)"
            class="flex items-center gap-2 rounded px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold-soft)] hover:bg-[var(--color-bg-panel)]"
            :class="isActive(g.slug)
              ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold-soft)]'
              : ''"
            :aria-current="isActive(g.slug) ? 'page' : undefined"
            @click="close()"
          >
            <Icon :name="g.icon" class="size-4 shrink-0" />
            {{ $t(g.titleKey) }}
          </NuxtLink>
        </nav>
        <div class="border-t border-[var(--color-border)] px-2 py-3">
          <NuxtLink
            :to="localePath('/settings')"
            class="flex items-center gap-2 rounded px-3 py-2 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-gold)]"
            @click="close()"
          >
            <Icon name="i-lucide-settings" class="size-4 shrink-0" />
            {{ $t('app.settings') }}
          </NuxtLink>
        </div>
      </div>
    </template>
  </USlideover>
</template>
```

- [ ] **Step 3: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/app/AppSidebar.vue app/components/app/AppMobileDrawer.vue
git commit -m "feat(shell): add sidebar and mobile drawer navigation"
```

---

## Task 13: Default layout and app entry

**Files:**
- Create: `app/layouts/default.vue`
- Modify: `app/app.vue`

- [ ] **Step 1: Create `app/layouts/default.vue`**

```vue
<script setup lang="ts">
const drawerOpen = ref(false)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader :on-open-menu="() => drawerOpen = true" />
    <div class="flex flex-1 min-h-0">
      <AppSidebar />
      <main class="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">
        <slot />
      </main>
    </div>
    <AppMobileDrawer v-model="drawerOpen" />
    <UToaster />
  </div>
</template>
```

- [ ] **Step 2: Replace `app/app.vue`**

```vue
<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 3: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/layouts/default.vue app/app.vue
git commit -m "feat(shell): add default layout and hook it into app.vue"
```

---

## Task 14: Pages and error screen

**Files:**
- Create: `app/pages/index.vue`
- Create: `app/pages/[slug].vue`
- Create: `app/pages/settings.vue`
- Create: `app/error.vue`

- [ ] **Step 1: Create `app/pages/index.vue`**

```vue
<script setup lang="ts">
const { t } = useI18n()
const { generators } = useGeneratorRegistry()

useHead({
  title: () => `${t('home.title')} · ${t('app.brand')}`,
  meta: [{ name: 'description', content: () => t('home.description') }],
})
</script>

<template>
  <div>
    <SectionLabel>{{ $t('app.brand') }}</SectionLabel>
    <h1 class="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[var(--color-text-primary)]">
      {{ $t('home.title') }}
    </h1>
    <p class="mt-2 text-sm text-[var(--color-text-muted)] max-w-xl">
      {{ $t('home.description') }}
    </p>
    <div class="my-6">
      <OrnamentalDivider />
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GeneratorCard
        v-for="g in generators"
        :key="g.id"
        :generator="g"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Create `app/pages/[slug].vue`**

```vue
<script setup lang="ts">
const { t } = useI18n()
const { current } = useGeneratorRegistry()

if (!current.value) {
  throw createError({ statusCode: 404, statusMessage: 'Generator not found', fatal: true })
}

const GeneratorComponent = defineAsyncComponent(async () => {
  const mod = await current.value!.component()
  return mod.default
})

useHead({
  title: () => current.value
    ? `${t(current.value.titleKey)} · ${t('app.brand')}`
    : t('app.brand'),
  meta: [{
    name: 'description',
    content: () => current.value ? t(current.value.descriptionKey) : '',
  }],
})
</script>

<template>
  <GeneratorShell v-if="current" :generator="current">
    <component :is="GeneratorComponent" />
  </GeneratorShell>
</template>
```

- [ ] **Step 3: Create `app/pages/settings.vue`**

```vue
<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: () => `${t('app.settings')} · ${t('app.brand')}`,
})
</script>

<template>
  <div class="max-w-2xl">
    <SectionLabel>{{ $t('app.settings') }}</SectionLabel>
    <h1 class="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text-primary)]">
      {{ $t('app.settings') }}
    </h1>
    <div class="my-6">
      <OrnamentalDivider variant="short" />
    </div>
    <GoldFrame>
      <p class="text-sm text-[var(--color-text-muted)]">
        {{ $t('generator.comingSoon') }}
      </p>
    </GoldFrame>
  </div>
</template>
```

- [ ] **Step 4: Create `app/error.vue`**

```vue
<script setup lang="ts">
interface NuxtError {
  statusCode?: number
  statusMessage?: string
  message?: string
}
defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

function clearAndGoHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-[var(--color-bg-base)] to-[var(--color-bg-deep)]">
    <div class="max-w-md text-center">
      <div class="text-[var(--color-gold)] text-5xl mb-3">⚜</div>
      <div class="mb-4"><OrnamentalDivider /></div>
      <h1 class="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text-primary)]">
        {{ error.statusCode === 404 ? t('error.notFound.title') : t('error.generic.title') }}
      </h1>
      <p v-if="error.statusCode === 404" class="mt-3 text-sm text-[var(--color-text-muted)]">
        {{ t('error.notFound.description') }}
      </p>
      <div class="mt-6">
        <UButton color="primary" variant="solid" icon="i-lucide-arrow-left" @click="clearAndGoHome">
          {{ error.statusCode === 404 ? t('error.notFound.action') : t('error.generic.action') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Run `nuxi prepare`**

Run: `npx nuxi prepare`

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/pages/ app/error.vue
git commit -m "feat(pages): add home grid, dynamic generator route, settings, and error page"
```

---

## Task 15: Static favicon and robots updates (optional polish)

**Files:**
- Modify: `public/robots.txt`

- [ ] **Step 1: Update `public/robots.txt`**

```
User-agent: *
Allow: /
```

- [ ] **Step 2: Commit (only if the file changed)**

Run: `git status --short public/`

If `robots.txt` changed:

```bash
git add public/robots.txt
git commit -m "chore: update robots.txt"
```

If not, skip this task.

---

## Task 16: Smoke test and QA checklist

**Files:** none (manual verification)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: server listens on `http://localhost:3000`. No compile-time errors in the terminal.

- [ ] **Step 2: Walk the QA checklist**

Open `http://localhost:3000` and verify each item. Fix any defect with a follow-up commit before marking the task complete:

- [ ] Home loads, shows exactly one generator card (`Example`), ornament divider visible.
- [ ] Clicking the card navigates to `/example` (URL stays `/example` in EN).
- [ ] The generator page shows the `Coming soon` frame and the sample `MacroPreview`.
- [ ] The sidebar highlights `Example` with the gold left border while on `/example`.
- [ ] The sidebar collapse button works; reload the page — collapsed state is preserved.
- [ ] Resize window to ≤ 767px: sidebar disappears, header shows a menu button. Tapping it opens the drawer. Selecting `Example` in the drawer navigates and closes the drawer.
- [ ] The language switcher shows `EN` and `FR`. Choosing `FR` routes to `/fr` and `/fr/example`; all strings translate.
- [ ] Visiting `/does-not-exist` (or `/fr/does-not-exist`) renders the styled 404 page with a working "Back to home" button.
- [ ] Clicking the copy button on the generator preview triggers the "Copied to clipboard" toast and clipboard contains the `/p`-prefixed macro lines.
- [ ] DevTools Console: no runtime errors. Terminal: no `@nuxt/a11y` warnings.

- [ ] **Step 3: Run a production build**

Run: `npm run generate`

Expected: completes without errors and writes to `.output/public/`.

- [ ] **Step 4: Smoke-test the static build**

Run: `npx serve .output/public --single`

Visit the served URL. Verify the home and `/example` both render.

- [ ] **Step 5: Commit any fixes from QA**

If QA surfaced bugs, fix them and commit with scoped messages. If nothing was changed during QA, no commit is needed.

- [ ] **Step 6: Final wrap-up commit (only if untracked files remain)**

Run: `git status`

If the working tree is clean, the plan is complete. If files are left untracked (e.g. `.output/`), confirm they are in `.gitignore`. Do not commit build artefacts.

---

## Self-Review

**Spec coverage:**

- Stack + modules → Task 1 (+3 for `@nuxt/ui` config). ✓
- Design tokens, colors, fonts → Task 2. ✓
- `@nuxt/ui` theming (`primary: gold`, card/input slots) → Task 3. ✓
- Generator contract interface → Task 4. ✓
- Registry with `import.meta.glob` + `findBySlug` → Task 4. ✓
- `generators/README.md` ("how to add a generator") → Task 4. ✓
- i18n with EN default, FR, `prefix_except_default`, full V1 string budget → Task 5. ✓
- Pinia settings store with `sidebarCollapsed`, persistence via `pinia-plugin-persistedstate` → Task 6. ✓
- Composables: `useGeneratorRegistry`, `useMacroValidator`, `useMacroClipboard` → Task 7. ✓
- Ornament components: `OrnamentalDivider` (full/short), `GoldFrame`, `SectionLabel` → Task 8. ✓
- Shared generator UI: `GeneratorCard`, `GeneratorShell`, `MacroPreview` (with 15-line / 180-char status) → Task 9. ✓
- Placeholder `example` generator → Task 10. ✓
- App shell: header (brand + subtitle + language switcher + ornament), sidebar (ornamented, collapsible, settings entry), mobile drawer → Tasks 11 and 12. ✓
- Default layout wiring → Task 13. ✓
- Home grid + `[slug].vue` + `settings.vue` + `error.vue` with `useHead()` → Task 14. ✓
- Manual QA checklist → Task 16. ✓
- No Vitest in V1 → no test tasks written. ✓

**Placeholder scan:** no "TBD", no "handle appropriately", no "similar to Task N". The only literal placeholder in the code is the `example` generator, which the spec requires.

**Type / name consistency:** `GeneratorDefinition` keys (`id`, `slug`, `order`, `icon`, `titleKey`, `descriptionKey`, `component`, `badge`) are identical across `types/generator.ts`, `registry.ts`, `example/index.ts`, and every consumer (`GeneratorCard`, `GeneratorShell`, `AppSidebar`, `AppMobileDrawer`). `useSettingsStore` exposes `sidebarCollapsed` / `toggleSidebar()` and both sidebar components call them consistently. `MacroPreview` uses `useMacroValidator` with the same `validation.isValid` / `validation.lineCount` / `validation.maxCharCount` surface the composable defines. The `useMacroClipboard.copy(text)` signature matches its single call site.
