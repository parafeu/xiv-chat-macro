import type { GeneratorDefinition } from '~/types/generator'

export default {
  id: 'alert-box',
  slug: 'alert',
  order: 10,
  icon: 'i-lucide-megaphone',
  titleKey: 'generators.alertBox.title',
  descriptionKey: 'generators.alertBox.description',
  component: () => import('./Generator.vue'),
} satisfies GeneratorDefinition
