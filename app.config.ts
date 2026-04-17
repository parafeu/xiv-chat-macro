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
  },
})
