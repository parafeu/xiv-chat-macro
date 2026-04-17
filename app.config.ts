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
