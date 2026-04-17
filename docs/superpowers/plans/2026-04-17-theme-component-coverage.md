# Theme component coverage implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `UDropdownMenu`, `USlideover`, `UToaster`/toasts, and future `@nuxt/ui` components into the FF14 gold/deep-blue theme with a single token layer + three targeted slot overrides.

**Architecture:** Two-layer theming. (1) `app/assets/css/main.css` maps Nuxt UI semantic tokens (`--ui-bg`, `--ui-border`, `--ui-text-*`, `--ui-radius`) to existing FF14 tokens inside `.dark { … }`; this alone covers every Nuxt UI component via its token-backed utilities (`bg-default`, `ring-default`, `text-muted`, …). (2) `app.config.ts` adds FF14-specific flourishes for the three components that need them (gold top-rule on dropdown, blurred overlay on slideover, gold ring on toast) and simplifies existing `card`/`input` overrides. `AppMobileDrawer.vue` drops its inline `:ui` patch and keeps `max-w-64` as a regular class.

**Tech Stack:** Nuxt 4, `@nuxt/ui` v3, Tailwind v4, existing CSS custom properties in `main.css`.

**Notes about testing:** Per the shell spec, v1 defers automated tests. Verification for this plan is manual: a smoke check after each task via `npm run dev` + devtools, and a full QA pass at the end (see Task 6). Each task ends with a commit once the manual check passes.

---

## File Structure

Three files, three focused responsibilities:

- `app/assets/css/main.css` — adds the `.dark { --ui-* }` token-mapping block directly after the existing `:root { … }` block. No other changes to the file.
- `app.config.ts` — simplifies existing `card`/`input` slot classes and adds three new slot overrides (`dropdownMenu`, `slideover`, `toast`). The file stays a single `defineAppConfig` call.
- `app/components/app/AppMobileDrawer.vue` — removes the inline `:ui="{ content: 'max-w-64 bg-[var(--color-bg-base)]' }"` prop. The `max-w-64` width becomes a regular class on `<USlideover>`; `bg-[var(--color-bg-base)]` is obsolete because the slideover now inherits the themed `bg-default`.

No files deleted, no files created. No new tokens in `main.css`; we reuse the already-defined `--color-*` palette.

---

## Task 1: Map Nuxt UI semantic tokens to FF14 palette

**Files:**
- Modify: `app/assets/css/main.css` (append a new `.dark { … }` block after the existing `:root { … }` block, before the `html, body` selector)

- [ ] **Step 1: Read the current state of `main.css`**

Read `app/assets/css/main.css` to confirm the file still looks like the version in the spec (tokens in `:root`, no prior `.dark` override). If someone has already added a `.dark` block, merge into it instead of creating a new one.

- [ ] **Step 2: Append the `.dark` token-mapping block**

Insert the following block into `app/assets/css/main.css` immediately after the existing `:root { … }` block (around line 47) and before the `html, body { … }` rule:

```css
/* --- Nuxt UI v3 semantic token overrides. ------------------------------ */
/* The `.dark` class is applied in nuxt.config.ts (htmlAttrs + colorMode). */
/* Mapping these tokens to our FF14 palette re-themes every `@nuxt/ui`    */
/* component that uses token-backed utilities (bg-default, ring-default,  */
/* text-muted, …) — no per-component override required for 80% of cases. */
.dark {
  /* Surfaces */
  --ui-bg:           var(--color-bg-deep);
  --ui-bg-muted:     var(--color-bg-base);
  --ui-bg-elevated:  rgba(201, 169, 98, 0.08);
  --ui-bg-accented:  rgba(201, 169, 98, 0.14);
  --ui-bg-inverted:  var(--color-text-primary);

  /* Borders / rings */
  --ui-border:           var(--color-border);
  --ui-border-muted:     rgba(201, 169, 98, 0.10);
  --ui-border-accented:  var(--color-border-strong);
  --ui-border-inverted:  var(--color-gold);

  /* Text */
  --ui-text-dimmed:       var(--color-text-dim);
  --ui-text-muted:        var(--color-text-muted);
  --ui-text-toned:        var(--color-text-body);
  --ui-text:              var(--color-text-body);
  --ui-text-highlighted:  var(--color-text-primary);
  --ui-text-inverted:     var(--color-bg-base);

  /* Global radius aligned with ornament primitives (4–8px) */
  --ui-radius: 0.375rem;
}
```

- [ ] **Step 3: Start the dev server and smoke-check the dropdown**

Run from the repo root:

```bash
npm run dev
```

Open `http://localhost:3000/` in a browser. Click the language switcher (`EN` button in the header).

Expected:
- The popup opens on a **dark surface** (close to `#121624`, no more zinc-neutral fill).
- The popup has a **gold-translucent outline** (`ring-default` now points to `--color-border`).
- The hover on the non-active locale shows a subtle gold halo.
- The active locale (`EN`) is rendered in bright gold.

If the dropdown still renders zinc, check devtools → Elements → `<html>` has `class="dark"`. If not, the `colorMode` plugin has a regression; stop and inspect `nuxt.config.ts`.

- [ ] **Step 4: Smoke-check the mobile drawer and a toast**

In devtools, switch to a `< 768px` viewport and click the menu icon. Expected: the drawer opens with the themed dark surface. The inline patch is still there, so the background was already dark — what we're checking is that nothing *broke* (no contrast flips, no invisible text).

Emit a toast manually by opening the browser devtools console on any page and running:

```js
(await import('#imports')).useToast().add({ title: 'theme check' })
```

Expected: the toast renders on a dark surface with a gold translucent ring. Icon colors and title color come from `--ui-text-highlighted` (our `--color-text-primary`).

- [ ] **Step 5: Commit**

```bash
git add app/assets/css/main.css
git commit -m "feat(theme): map @nuxt/ui semantic tokens to FF14 palette

Adds a .dark { --ui-* } block that pipes Nuxt UI's bg/border/text
tokens through our existing --color-* FF14 palette. Every Nuxt UI
component that reads token-backed utilities (bg-default, ring-default,
text-muted, …) now renders in the gold/deep-blue theme by default,
including UDropdownMenu, USlideover, and UToaster."
```

---

## Task 2: Simplify `card` and `input` overrides to lean on tokens

**Files:**
- Modify: `app.config.ts`

- [ ] **Step 1: Read `app.config.ts` to confirm the current state**

The file currently uses literal utilities like `bg-[var(--color-bg-panel)]` in the `card.slots.root` and `input.slots.base`. After Task 1 the same surfaces are reachable through `bg-default` / `bg-muted` / `text-toned` / `text-dimmed`, so we simplify.

- [ ] **Step 2: Replace the `card` and `input` overrides**

In `app.config.ts`, replace the `card` and `input` entries so the `ui` object looks like this (keep `colors` and `button` unchanged):

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
        root: 'bg-default border border-default rounded-md',
      },
    },
    input: {
      slots: {
        base: 'bg-muted border border-default text-toned placeholder:text-dimmed',
      },
    },
  },
})
```

- [ ] **Step 3: Smoke-check that nothing regressed**

With `npm run dev` still running, hard-reload the browser. Neither `UCard` nor `UInput` is instantiated anywhere in v1, so visually there's nothing to see. We verify that:

- `npm run dev` has not printed a Tailwind / tv() warning about unknown utilities.
- The home page, `/example` page, and settings page all still render (server responds 200, no hydration error in the console).

Optional sanity check: create a scratch component that renders `<UCard><UInput placeholder="test" /></UCard>` on the home page, verify the card panel is gold-translucent and the input has our dark-translucent bg, then revert the scratch.

- [ ] **Step 4: Commit**

```bash
git add app.config.ts
git commit -m "refactor(theme): use semantic utilities for card and input

Now that --ui-* tokens point at the FF14 palette, card and input
can rely on bg-default / bg-muted / text-toned / text-dimmed instead
of hand-rolled bg-[var(--color-bg-panel)] classes. Same visual, less
surface area."
```

---

## Task 3: Theme `UDropdownMenu`

**Files:**
- Modify: `app.config.ts`

- [ ] **Step 1: Add the `dropdownMenu` slot override**

Inside the `ui` object in `app.config.ts`, add the following entry after `input` and before the closing brace:

```ts
dropdownMenu: {
  slots: {
    content:
      'min-w-40 bg-default ring ring-default rounded-md shadow-xl shadow-black/40 '
      + 'relative before:absolute before:inset-x-3 before:-top-px before:h-px '
      + 'before:bg-gradient-to-r before:from-transparent before:via-[var(--color-gold)]/60 before:to-transparent '
      + 'before:pointer-events-none',
    separator: '-mx-1 my-1 h-px bg-[var(--color-border)]',
    label:
      'w-full flex items-center text-[10px] uppercase tracking-[0.2em] '
      + 'text-[var(--color-gold-dim)] font-semibold',
    item:
      'group relative w-full flex items-start select-none outline-none '
      + 'before:absolute before:z-[-1] before:inset-px before:rounded-[5px] '
      + 'data-disabled:cursor-not-allowed data-disabled:opacity-60',
  },
},
```

Full resulting file (for reference, no guesswork):

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
        root: 'bg-default border border-default rounded-md',
      },
    },
    input: {
      slots: {
        base: 'bg-muted border border-default text-toned placeholder:text-dimmed',
      },
    },
    dropdownMenu: {
      slots: {
        content:
          'min-w-40 bg-default ring ring-default rounded-md shadow-xl shadow-black/40 '
          + 'relative before:absolute before:inset-x-3 before:-top-px before:h-px '
          + 'before:bg-gradient-to-r before:from-transparent before:via-[var(--color-gold)]/60 before:to-transparent '
          + 'before:pointer-events-none',
        separator: '-mx-1 my-1 h-px bg-[var(--color-border)]',
        label:
          'w-full flex items-center text-[10px] uppercase tracking-[0.2em] '
          + 'text-[var(--color-gold-dim)] font-semibold',
        item:
          'group relative w-full flex items-start select-none outline-none '
          + 'before:absolute before:z-[-1] before:inset-px before:rounded-[5px] '
          + 'data-disabled:cursor-not-allowed data-disabled:opacity-60',
      },
    },
  },
})
```

- [ ] **Step 2: Verify the gold top-rule**

Hard-reload the browser. Click the language switcher.

Expected visuals:
- A faint **horizontal gold filament** at the very top of the popup, fading to transparent on both ends (same treatment as on `GeneratorCard` and `MacroPreview`).
- Drop shadow is clearly darker than before (was `shadow-lg` default, now `shadow-xl shadow-black/40`).
- Active locale (`EN` currently): bright gold text. Inactive locale (`FR`): muted text; on hover, a soft gold halo behind the row (≈ `--color-gold @ 10%`).
- Item corner radius is 5px (slightly tighter than `rounded-md`), matching the FF14 aesthetic.

If the filament doesn't appear, the `before:` arbitrary value might have been stripped by Tailwind's JIT. Check devtools; the `before` pseudo-element should have `content: var(--tw-content)` set — we don't need explicit `content-['']` because Nuxt UI's own theme adds it on `item`. For `content`, we do need it — add `before:content-['']` to the `content` slot classes if needed.

- [ ] **Step 3: Commit**

```bash
git add app.config.ts
git commit -m "feat(theme): gold-accent the dropdown menu

Adds bg-default + ring-default surface + a gradient top-rule using
--color-gold, a tighter item radius, and a small-caps gold-dim label
so the language switcher (and every future UDropdownMenu) matches the
FF14 aesthetic."
```

---

## Task 4: Theme `USlideover` and clean `AppMobileDrawer.vue`

**Files:**
- Modify: `app.config.ts`
- Modify: `app/components/app/AppMobileDrawer.vue`

- [ ] **Step 1: Add the `slideover` slot override in `app.config.ts`**

Inside the `ui` object, after the `dropdownMenu` entry, add:

```ts
slideover: {
  slots: {
    content: 'bg-default ring-1 ring-default',
    overlay: 'bg-black/60 backdrop-blur-sm',
  },
},
```

- [ ] **Step 2: Remove the inline `:ui` patch and keep the width as a class**

Open `app/components/app/AppMobileDrawer.vue`. Replace the `<USlideover …>` opening tag so the max-width stays on the component itself via the `class` prop (forwarded by Nuxt UI to the content slot):

Old (line 18):

```vue
<USlideover v-model:open="open" side="left" :ui="{ content: 'max-w-64 bg-[var(--color-bg-base)]' }">
```

New:

```vue
<USlideover v-model:open="open" side="left" :ui="{ content: 'max-w-64' }">
```

We keep a tiny `:ui` override just for the width (drawer-specific, doesn't belong in the global theme). Everything else now flows from the global `slideover` theme.

- [ ] **Step 3: Smoke-check the drawer**

Hard-reload. Resize to a mobile viewport (`< 768px`). Click the menu icon in the header.

Expected:
- Drawer slides in from the left, **still constrained to `max-w-64`** (no full-screen).
- Content background is now `--color-bg-deep` (was `--color-bg-base` inline).
- Overlay is visibly dimmer (`bg-black/60`) and **blurred** (`backdrop-blur-sm`) — the home grid behind it goes soft.
- Focus trap works: Tab cycles only inside the drawer.
- Closing (clicking the overlay, pressing Escape, or clicking a nav link) works as before.

- [ ] **Step 4: Commit**

```bash
git add app.config.ts app/components/app/AppMobileDrawer.vue
git commit -m "feat(theme): theme USlideover + drop inline patch from drawer

Moves the slideover surface styling into the global theme (bg-default
+ ring-default + blurred overlay). AppMobileDrawer.vue now only sets
the drawer-specific max-w-64 inline, and drops the now-obsolete
bg-[var(--color-bg-base)] override."
```

---

## Task 5: Theme `UToast`

**Files:**
- Modify: `app.config.ts`

- [ ] **Step 1: Add the `toast` slot override**

Inside the `ui` object, after the `slideover` entry, add:

```ts
toast: {
  slots: {
    root: 'bg-default ring-1 ring-default shadow-xl shadow-black/40 rounded-md',
    title: 'text-highlighted font-medium',
    description: 'text-muted',
  },
},
```

We deliberately don't bind toast color to `primary` — the `color` variants in `toast.ts` (primary/success/warning/error) keep their semantic tinting so error toasts stay red, warning toasts stay gold-warm, etc.

- [ ] **Step 2: Smoke-check a toast**

Hard-reload. Open the devtools console on any page and run:

```js
const { useToast } = await import('#imports')
useToast().add({ title: 'Macro forged', description: 'Copied to clipboard' })
useToast().add({ title: 'Too many lines', description: 'FF14 caps at 15', color: 'error' })
```

Expected:
- First toast: dark `bg-default` surface, gold translucent ring, title in bright text, description muted.
- Second toast: same surface, but focus ring tint is `--ui-color-error-*` (kept by the baked-in compound variants).

If the toast still looks neutral (no gold ring), confirm the `UToaster` is mounted in `app/layouts/default.vue` (`<UToaster />`). If `useToast()` throws in console, you may need to run from a page that mounted the app; `http://localhost:3000/example` is safe.

- [ ] **Step 3: Commit**

```bash
git add app.config.ts
git commit -m "feat(theme): gold-ring toasts

Toast root picks up bg-default + ring-default + shadow-xl so any toast
(including success, warning, error variants whose semantic coloring
is preserved) reads as part of the FF14 shell."
```

---

## Task 6: Full manual QA pass

**Files:**
- No code changes; verification only.

- [ ] **Step 1: Start a fresh dev server**

Stop the running dev server (Ctrl+C) and relaunch:

```bash
npm run dev
```

Expected: no new warnings in the terminal (Tailwind JIT, `@nuxt/a11y`, Vue).

- [ ] **Step 2: Run the QA checklist**

Walk through each item in devtools / the browser. For any failure, open a new task in this session; do **not** silently patch.

- [ ] Home (`/`) loads and shows the `Example` generator card. Gold filament on card top, hover intensifies the border.
- [ ] Header language switcher: dropdown renders with gold filament, dark surface, bright gold active locale, soft gold hover halo on inactive locale.
- [ ] Switching locale (`EN → FR`) changes the URL prefix (`/example → /fr/example`) and translates visible strings.
- [ ] Sidebar (`≥ 768px`): active item has gold left-border and gold-soft text. Collapse toggle works and persists after reload.
- [ ] Mobile (`< 768px`): header menu button opens the drawer. Drawer has `max-w-64`, bg `--color-bg-deep`, overlay `bg-black/60` with `backdrop-blur-sm`. Drawer closes on link click and on overlay click.
- [ ] Toast (via devtools console `useToast().add({ title: 'x' })`): dark surface, gold ring, bright title, muted description.
- [ ] Error variant toast (`color: 'error'`): semantic red accents preserved.
- [ ] Navigate to `/foo` (unknown slug): styled 404 page renders with working "Back to home" button.
- [ ] `@nuxt/a11y` devtools panel (or the in-dev warnings overlay): zero warnings on any of the above interactions.
- [ ] `prefers-reduced-motion`: in devtools → Rendering → "Emulate CSS media feature prefers-reduced-motion", set to "reduce". Re-open the dropdown and the drawer: transitions collapse to ~0ms, no slide animation on the drawer.

- [ ] **Step 3: Lighthouse accessibility spot check**

In Chrome devtools → Lighthouse → Accessibility only → run on `/` and on `/example`. Expected score: ≥ 95 on both.

If a regression shows up (e.g. contrast below threshold on the new toast title/description), record it and open a follow-up task — don't bend the tokens to pass without understanding why.

- [ ] **Step 4: Production build smoke test**

Stop `npm run dev` (Ctrl+C) and run:

```bash
npm run generate
```

Expected: build completes without errors. Then:

```bash
npx serve .output/public -p 4173
```

Open `http://localhost:4173/` and re-run the top four QA items (home, language switcher, sidebar active state, mobile drawer). Confirms nothing theme-related relied on dev-only CSS ordering.

- [ ] **Step 5: Final cleanup check**

Run:

```bash
git status
```

Expected: clean working tree. Every change should already be committed from tasks 1–5.

If anything is still dirty (e.g. a scratch component from Task 2), delete it and commit the cleanup separately:

```bash
git add -A
git commit -m "chore: remove scratch files used during theme QA"
```

---

## Self-review notes

Cross-checked against the spec:
- Spec `Tokens layer` → Task 1.
- Spec `Overrides layer`: `card`/`input` simplification → Task 2; `dropdownMenu` → Task 3; `slideover` → Task 4; `toast` → Task 5.
- Spec "Open question resolved during implementation" (keep `max-w-64` on the drawer root) → Task 4 Step 2.
- Spec `Verification (manual)` items → Task 6.

No placeholders, no "TBD", no "similar to Task N without showing code". All slot names verified against `.nuxt/ui/{dropdown-menu,slideover,toast}.ts` during brainstorming.
