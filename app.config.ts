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
        root: 'bg-[var(--color-bg-panel)] border border-default rounded-md',
      },
    },
    input: {
      slots: {
        base: 'bg-[var(--color-bg-input)] border border-default text-toned placeholder:text-dimmed',
      },
    },
    dropdownMenu: {
      slots: {
        content:
          'min-w-40 bg-default ring ring-default rounded-md shadow-xl shadow-black/40 '
          + 'relative before:absolute before:inset-x-3 before:-top-px before:h-px '
          + 'before:bg-gradient-to-r before:from-transparent before:via-[var(--color-gold)]/60 before:to-transparent '
          + 'before:pointer-events-none before:content-[\'\']',
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
  },
})
