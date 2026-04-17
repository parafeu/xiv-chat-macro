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
