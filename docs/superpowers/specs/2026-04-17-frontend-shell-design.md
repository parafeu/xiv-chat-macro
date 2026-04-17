# Frontend shell — FF14 Chat Macro Generator

**Date:** 2026-04-17
**Status:** Design approved, ready for implementation planning
**Scope:** V1 frontend shell only. Generator implementations are out of scope and come later.

## Goal

Build the complete frontend scaffolding for a FF14 chat macro generator app: visual system, navigation, layout, i18n, state management, and a registry-based architecture that makes it trivial to drop in additional generators later.

V1 ships with a single placeholder generator (`example`) to prove the shell works end-to-end. Real generators (alert-box, RP text, callouts, PF) will each be added later by creating a new folder under `app/generators/`.

## Non-goals

- Any real generator logic (transformations, ASCII box rendering, validation beyond the shared composable).
- Backend / database. The shell is static-generation-compatible but structured so a Nitro/NuxtHub backend can be added later without shell refactoring.
- Macro sharing by URL, persistence of saved templates, authentication.
- Automated tests of visual components (manual QA checklist only).

## Stack

Nuxt 4 + TypeScript, static build target (`nuxt generate`), hybrid-ready (Nitro available when backend is added).

**Nuxt modules:**
- `@nuxt/ui` v3 — component library, Tailwind v4 included
- `@nuxt/icon` — Lucide + Phosphor collections
- `@nuxt/a11y` — dev-time accessibility linting
- `@nuxt/fonts` — self-hosted Cormorant Garamond, Inter, JetBrains Mono
- `@nuxtjs/i18n` — EN default, FR secondary
- `@pinia/nuxt` — state management (settings store in v1)
- `@vueuse/nuxt` — `useClipboard`, `useLocalStorage`, `useMagicKeys`

**Not used in v1:** no Vitest setup, no backend, no storage adapter.

## Visual system

### Direction

"Modern FF14" — Eorzean fantasy inspiration executed with modern polish. Dark background gradient, muted gold accents, ornamental dividers, serif display font for titles, sans-serif for UI, monospace for macro previews. Roughly: V2 from the brainstorm (between subtle and assertive).

Dark mode only. Light mode is out of scope.

### Color tokens

Tokens are CSS custom properties defined in `app/assets/css/main.css` and wired into `@nuxt/ui` through `app.config.ts` (the `gold` palette becomes the `primary` color family).

```
--color-bg-base       #0b0e16
--color-bg-deep       #121624
--color-bg-panel      rgba(201, 169, 98, 0.04)
--color-bg-input      rgba(0, 0, 0, 0.25)

--color-gold          #c9a962
--color-gold-soft     #d4b877
--color-gold-bright   #e8d9a8
--color-gold-dim      #8b7355

--color-border        rgba(201, 169, 98, 0.18)
--color-border-strong rgba(201, 169, 98, 0.30)

--color-text-primary  #f5f2e8
--color-text-body     #e8e6df
--color-text-muted    #a8a69c
--color-text-dim      #6b6a63

--color-success       #7dd87d
--color-warning       #d4b877
--color-danger        #d87d7d
```

A derived `gold-50 … gold-950` scale is generated from `--color-gold` so Tailwind utilities (`bg-gold-500`, `text-gold-200`, etc.) work on top of the tokens.

### Typography

| Usage | Family | Weights |
|---|---|---|
| Display (brand, page titles, generator titles) | Cormorant Garamond | 500, 600 |
| UI body (labels, buttons, nav, captions) | Inter | 400, 500, 600 |
| Monospace (macro previews, output) | JetBrains Mono | 400 |

Loaded via `@nuxt/fonts`, self-hosted, zero external requests.

### Ornament components

Reusable building blocks that carry the FF14 flavour without ad-hoc CSS scattered across the codebase:

- `<OrnamentalDivider variant="full" />` → `✦ ─── ✦ ─── ✦`, centered gold text
- `<OrnamentalDivider variant="short" />` → `─────────`
- `<GoldFrame>` — container with a thin gradient rule on top (`transparent → gold → transparent`), gold translucent border, rounded 6px
- `<SectionLabel>` — small uppercase gold label (letter-spacing 3px) used above panels, e.g. `INPUTS`, `LIVE PREVIEW`

Corners stay at 4–8px radii. Spacing uses Tailwind's multiples of 4/8px.

### Accessibility

- `@nuxt/a11y` runs in dev; warnings are treated as bugs.
- Focus ring: 2px translucent gold (`ring-gold-500/40`).
- Sidebar uses `<nav>` with `aria-current="page"` on the active item.
- Language switcher is a `<UDropdown>` (reka-ui primitives, accessible by default).
- `prefers-reduced-motion` respected: no animated gradients, no glow pulses.

## Layout

One layout (`app/layouts/default.vue`) for every page.

```
┌────────────────────────────────────────────────────────┐
│                    HEADER (top bar)                     │
│   ⚜ Macro Forge      Chat macro generator     [🌐 EN]  │
│   ─────────── ✦ ─── ✦ ─── ✦ ───────────                │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │               <NuxtPage />                   │
│          │                                              │
│ ⚜        │                                              │
│  ✦─✦     │                                              │
│ Example  │                                              │
│  ─────   │                                              │
│ ⚙ Settings                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Header (`~70px`, fixed)

- Left: brand — `⚜` icon + "Macro Forge" in Cormorant Garamond 22px, a muted subtitle (neutral description like "Chat macro generator") in uppercase Inter 10px.
- Right: language switcher (`<UDropdown>`), globe icon + current locale code.
- Bottom border: thin gold translucent line; an `<OrnamentalDivider variant="full" />` sits just inside the content area as a visual handoff.

### Sidebar (`~210px`, collapsible to `~64px`)

- Logo `⚜` at the top, clickable → routes to `/` (home).
- Mini ornament `✦ ─ ✦`.
- Generator list, rendered from the registry. Each item: Lucide icon + translated title. Active item gets a gold translucent background, left gold border (2px), and `text-gold-soft`.
- Mini divider `─────` before system items.
- System items at the bottom: `Settings` (placeholder page, minimal content in v1).
- Collapse toggle at the top-right of the sidebar (chevron). State persisted in `useSettingsStore.sidebarCollapsed`.
- `< 768px`: sidebar is hidden and replaced by a `<USlideover>` drawer triggered from a menu button in the header.

### Content zone (flex-1, generous padding)

- Display-serif page title.
- Small uppercase gold `<SectionLabel>` below it (e.g. `GENERATOR`, `HOME`).
- Page body — home grid or generator component.

### Home (`/`)

- Grid of `<GeneratorCard>` components, 2–3 columns depending on viewport, one per registry entry.
- Each card: Lucide icon, title (serif), short description (muted), gold border that intensifies on hover, `<NuxtLinkLocale>` wrapping the whole card.
- `useHead()` sets a localized title and meta description.

### Generator route (`/[slug]`)

- Reads `slug` from the URL, looks up the generator in the registry.
- Unknown slug → custom 404 styled in V2 (serif "404", ornament, link back home).
- Lazy-loads `generator.component()` and renders it inside a `<GeneratorShell>` wrapper.
- `useHead()` sets a translated title (`generators.<id>.title`) and description.

### Breakpoints

- `< 768px`: sidebar → drawer, generator inner panels stack vertically.
- `≥ 768px`: sidebar visible, panels side-by-side.
- `≥ 1280px`: widened content padding and max-width.

## Architecture

### Directory layout

```
app/
├── app.vue                          # NuxtLayout + NuxtPage
├── layouts/
│   └── default.vue
├── pages/
│   ├── index.vue                    # Home grid
│   ├── settings.vue                 # Minimal placeholder
│   └── [slug].vue                   # Dynamic generator route
├── components/
│   ├── app/
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── AppMobileDrawer.vue
│   │   └── AppLanguageSwitcher.vue
│   ├── ornament/
│   │   ├── OrnamentalDivider.vue
│   │   ├── GoldFrame.vue
│   │   └── SectionLabel.vue
│   └── generator/
│       ├── GeneratorCard.vue
│       ├── GeneratorShell.vue
│       └── MacroPreview.vue
├── generators/
│   ├── registry.ts                  # import.meta.glob aggregator
│   ├── README.md                    # "how to add a generator"
│   └── example/
│       ├── index.ts                 # GeneratorDefinition
│       └── Generator.vue            # Placeholder scaffold
├── composables/
│   ├── useGeneratorRegistry.ts
│   ├── useMacroValidator.ts
│   └── useMacroClipboard.ts
├── stores/
│   └── settings.ts                  # Pinia: locale, sidebarCollapsed
├── i18n/
│   ├── i18n.config.ts
│   └── locales/
│       ├── en.json
│       └── fr.json
├── assets/
│   └── css/
│       └── main.css                 # Tokens, font-face declarations, base
├── types/
│   └── generator.ts
└── error.vue                        # Styled 404/500
```

### Generator contract

```ts
// app/types/generator.ts
import type { Component } from 'vue'

export interface GeneratorDefinition {
  id: string                         // e.g. 'alert-box'
  slug: string                       // URL segment, e.g. 'alert'
  order: number                      // Sidebar + home sort order
  icon: string                       // Icon name, e.g. 'i-lucide-square-code'
  titleKey: string                   // i18n key, e.g. 'generators.alertBox.title'
  descriptionKey: string             // i18n key for the home card
  component: () => Promise<{ default: Component }>
  badge?: 'new' | 'beta'             // Optional visual badge
}
```

### Registry

```ts
// app/generators/registry.ts
import type { GeneratorDefinition } from '~/types/generator'

const modules = import.meta.glob<{ default: GeneratorDefinition }>(
  './*/index.ts',
  { eager: true }
)

export const generators: GeneratorDefinition[] = Object
  .values(modules)
  .map(m => m.default)
  .sort((a, b) => a.order - b.order)

export function findBySlug(slug: string): GeneratorDefinition | undefined {
  return generators.find(g => g.slug === slug)
}
```

### Adding a generator later

Documented in `app/generators/README.md`. Three steps:

1. `mkdir app/generators/<name>/`
2. Create `index.ts` exporting a `GeneratorDefinition` as default.
3. Create `Generator.vue` with the generator's own inputs/preview/output.

The sidebar, home grid, and `/[slug]` route pick it up automatically.

### Placeholder generator (v1)

`app/generators/example/` ships with:

- `index.ts` with `{ id: 'example', slug: 'example', order: 0, icon: 'i-lucide-sparkles', titleKey: 'generators.example.title', descriptionKey: 'generators.example.description', component: () => import('./Generator.vue') }`
- `Generator.vue` showing a serif page title, a `<SectionLabel>Coming soon</SectionLabel>` band, and a static `<MacroPreview>` rendering a sample box. No input fields, no logic — just enough to prove the shell routes and renders correctly.

### Shared composables

`useGeneratorRegistry()` — returns `{ generators, findBySlug, current }` where `current` is a computed tied to the route slug.

`useMacroValidator(lines: MaybeRefOrGetter<string[]>)` — returns `{ lineCount, charCounts, maxCharCount, isValid, warnings }`. FF14 limits: ≤ 15 lines, ≤ 180 chars per line. Used by `<MacroPreview>` for the status bar.

`useMacroClipboard()` — thin wrapper around `useClipboard` from VueUse that shows a success toast via `@nuxt/ui`'s `useToast()`. Returns `{ copy(text: string): Promise<void> }`.

### State management (Pinia)

One store in v1: `useSettingsStore` in `app/stores/settings.ts`.

```ts
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    sidebarCollapsed: false,
    // Locale is managed by @nuxtjs/i18n; the store mirrors it for components
    // that need to react without importing from the i18n module directly.
  }),
  actions: {
    toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed }
  },
  persist: true  // via pinia-plugin-persistedstate, localStorage
})
```

## i18n

- Locales: `en` (default), `fr`.
- Strategy: `prefix_except_default` — English URLs are clean (`/alert`), French URLs prefixed (`/fr/alert`).
- Auto-detection on first visit (`detectBrowserLanguage: { useCookie: true }`), persisted.
- Locale files lazy-loaded from `i18n/locales/`.
- Every user-facing string goes through `t()` — no hardcoded text in templates, even in v1.

**V1 string budget** (same keys in both locales):

```
app.brand                       "Macro Forge"
app.subtitle                    "Chat macro generator"
app.settings                    "Settings"
app.languageSwitcher            "Language"
nav.home                        "Home"
nav.collapseSidebar             "Collapse sidebar"
nav.openMenu                    "Open menu"
home.title                      "Generators"
home.description                "Pick a forge to craft your chat macros."
generator.label                 "GENERATOR"
generator.comingSoon            "Coming soon"
preview.label                   "Live preview"
preview.status.valid            "Valid for FF14"
preview.status.invalid          "Exceeds macro limits"
preview.status.lines            "{current} / 15 lines"
preview.status.chars            "max {max} / 180 chars"
macro.copy                      "Copy macro"
macro.copied                    "Copied to clipboard"
error.notFound.title            "Page not found"
error.notFound.action           "Back to home"
generators.example.title        "Example"
generators.example.description  "Placeholder generator — scaffold only."
```

## Performance & SEO

- `nuxt generate` as the v1 build. Deployable for free on Cloudflare Pages / GitHub Pages / Netlify.
- Fonts self-hosted (no Google Fonts request).
- `<NuxtLinkLocale>` for all internal links so locale prefixes stay correct.
- `useHead()` on `index.vue`, `settings.vue`, `[slug].vue`, and `error.vue`, all localized.

## Manual QA checklist

Ran after implementation, before declaring v1 done:

- [ ] Home loads, shows one generator card (`Example`).
- [ ] Clicking the card navigates to `/example` (or `/fr/example` in French).
- [ ] Sidebar highlights the active generator.
- [ ] Sidebar collapse toggle works and persists after reload.
- [ ] Mobile (<768px): drawer opens from header, closes on navigation.
- [ ] Language switcher changes locale and URL prefix correctly.
- [ ] Unknown slug (`/foo`) renders the styled 404 with working "Back to home" link.
- [ ] `@nuxt/a11y` shows zero warnings in dev.
- [ ] Lighthouse accessibility ≥ 95 on home and `/example`.
- [ ] `npm run generate` builds successfully, output directory serves correctly via `npx serve`.

## Out of scope (for this spec)

- Real generator implementations.
- Backend, database, macro sharing, auth.
- Automated tests. A Vitest setup will come with the first real generator that owns non-trivial logic (`useMacroValidator` will be tested then).
- Toolbar/command palette (`⌘K`). Can be added later; sidebar navigation is enough for v1.

## Next step

Hand off to the `writing-plans` skill to produce a concrete implementation plan.
