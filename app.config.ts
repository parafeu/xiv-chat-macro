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
