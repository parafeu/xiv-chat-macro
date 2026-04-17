# Theme component coverage — dropdown, slideover, toast

**Date:** 2026-04-17
**Status:** Design approved, ready for implementation planning
**Scope:** Extend the existing FF14 theme so every `@nuxt/ui` component already wired into the shell (or produced by shared composables) renders in the gold / deep-blue palette without per-usage overrides.

## Context

The frontend shell spec (`2026-04-17-frontend-shell-design.md`) established tokens, fonts, and ornament primitives, then wired `@nuxt/ui` v3 with `primary: 'gold'`. Implementation shipped theme overrides for `button`, `card`, `input` in `app.config.ts`, but left three components untouched:

- `UDropdownMenu` — used by `AppLanguageSwitcher`, currently renders on the default zinc surface.
- `USlideover` — used by `AppMobileDrawer`, patched with an inline `:ui="{ content: 'max-w-64 bg-[var(--color-bg-base)]' }"`.
- `UToaster` / toasts emitted by `useMacroClipboard` — used in `default.vue`, currently renders on zinc.

The gap is visible as soon as the language dropdown opens. It will get worse as more Nuxt UI components are introduced (select, modal, command palette, kbd). The fix is to lift the theming into the semantic tokens layer so future components are covered by default, and only add per-component overrides for the FF14-specific flourishes.

## Goal

Cover every currently-instantiated Nuxt UI component with the FF14 look, and pre-cover every future one with the same tokens, while keeping the theming surface small and centralized.

## Non-goals

- Light theme. The app is dark-only (`colorMode.preference: 'dark'`, `htmlAttrs.class: 'dark'`).
- Proactive theming of components not yet used (`popover`, `modal`, `select`, `commandPalette`, `kbd`). They inherit the token layer; ad-hoc overrides land when the component enters the codebase.
- Refactoring `UButton` beyond the existing default-color override. The current `solid`/`ghost` variants already render correctly with `primary: 'gold'`.
- New CSS tokens. We recycle `--color-bg-*`, `--color-border*`, `--color-gold*`, `--color-text-*` from `main.css`.

## Approach

Hybrid, two-layer theming:

1. **Tokens layer — `app/assets/css/main.css`** maps Nuxt UI's semantic tokens (`--ui-bg`, `--ui-border`, `--ui-text-*`, …) to our FF14 tokens inside `.dark { … }`. One block, all components covered at a stroke.
2. **Overrides layer — `app.config.ts`** simplifies existing overrides (card, input) to lean on token-backed utilities (`bg-default`, `border-default`, `text-toned`), and adds slot overrides for the three components that need an FF14-specific flourish (gold top-rule on dropdown, overlay blur on slideover, gold ring on toast).

## Design

### Tokens layer — `main.css`

Appended to the existing `:root { … }` block, as a `.dark` selector (active because `htmlAttrs.class: 'dark'` is set in `nuxt.config.ts`).

```css
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

Once this block is in place, every Nuxt UI utility that reads these tokens (`bg-default`, `bg-elevated`, `text-muted`, `border-default`, `ring-default`, …) resolves to the FF14 palette. The existing `--color-gold-*` scale and `primary: 'gold'` config keep accent colors (primary buttons, active items) doing the right thing already.

### Overrides layer — `app.config.ts`

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'gold',
      neutral: 'zinc',
    },

    button: {
      defaultVariants: { color: 'primary' },
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

    slideover: {
      slots: {
        content: 'bg-default ring-1 ring-default',
        overlay: 'bg-black/60 backdrop-blur-sm',
      },
    },

    toast: {
      slots: {
        root: 'bg-default ring-1 ring-default shadow-xl shadow-black/40 rounded-md',
        title: 'text-highlighted font-medium',
        description: 'text-muted',
      },
    },
  },
})
```

**Design notes on the overrides:**

- `dropdownMenu.content`: the thin gold top-rule (`before:…gradient…`) mirrors the same decoration used on `GeneratorCard` and `MacroPreview`, so the dropdown reads as part of the same visual family. `ring-default` gives it the gold-translucent outline from our tokens.
- `dropdownMenu.item`: the structural classes are kept; the color styling (text, hover halo, active halo) comes from the `active`/`color` compound variants already defined in the baked-in theme — `primary: 'gold'` makes them all render in our gold palette.
- `dropdownMenu.separator`: token-backed bg so the color stays in sync.
- `slideover.content`: `bg-default` inherits `--color-bg-deep`, replacing the inline `bg-[var(--color-bg-base)]` patch.
- `slideover.overlay`: darker scrim + blur gives the drawer a proper FF14 "curtain reveal" feel without adding animation.
- `toast.*`: neutral-safe defaults; we don't bind toast color to primary on purpose — error / warning variants keep their semantic coloring (`--color-danger`, `--color-warning`).

### Files touched

| File | Change |
|---|---|
| `app/assets/css/main.css` | Add `.dark { --ui-* … }` token block. |
| `app.config.ts` | Simplify `card` / `input` overrides. Add `dropdownMenu`, `slideover`, `toast` overrides. |
| `app/components/app/AppMobileDrawer.vue` | Remove inline `:ui="{ content: 'max-w-64 bg-[var(--color-bg-base)]' }"`. Keep the `max-w-64` somewhere appropriate (see "Open question" below). |

### Open question resolved during implementation

`AppMobileDrawer.vue` currently sets `max-w-64` through the inline `:ui` override. After removing the inline override, the width constraint must migrate somewhere. Options:

- Apply `class="max-w-64"` on the `<USlideover>` root. Simplest. Recommended.
- Push the width into the global `slideover.content` override. Rejected — width is drawer-specific, not a theme concern.

Implementation picks the first option.

## Verification (manual)

- [ ] `npm run dev` starts with no new console warnings.
- [ ] Language dropdown in the header: dark background, gold top-rule on the popup, active locale (`EN` / `FR`) in bright gold, hover on the other locale shows a soft gold halo.
- [ ] Mobile drawer (`< 768px`): opens with the same dark surface as the rest of the shell, dimmed + blurred overlay, gold translucent ring. Inline `:ui` patch is gone from `AppMobileDrawer.vue` and the visual is equal or better.
- [ ] A toast (emitted manually via devtools `useToast()` or by triggering `useMacroClipboard`) renders on the dark surface with the gold ring; error / warning variants keep their semantic colors.
- [ ] `UCard` and `UInput` (not instantiated in v1) — quick smoke test on a scratch page; ensures the simplified overrides didn't regress the panel / input rendering.
- [ ] `@nuxt/a11y` shows zero warnings on dropdown open and drawer open (focus trap, `aria-current`).
- [ ] Lighthouse accessibility on home ≥ 95 (unchanged from the shell baseline).
- [ ] `npm run generate` completes successfully.
- [ ] `prefers-reduced-motion` simulated in devtools: dropdown `scale-in` / `scale-out` animations collapse to ~0ms (already handled by the existing `@media` block in `main.css`).

## Out of scope

- Automated tests (deferred with the rest of the shell — per the shell spec).
- Light theme.
- Theming of Nuxt UI components not currently instantiated.
- Visual changes to ornament primitives, pages, or layouts.

## Next step

Hand off to the `writing-plans` skill to produce a task-by-task implementation plan.
