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
