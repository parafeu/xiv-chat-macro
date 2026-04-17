import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { generators, findBySlug } from '~/generators/registry'
import type { GeneratorDefinition } from '~/types/generator'

export function useGeneratorRegistry() {
  const route = useRoute()

  const current = computed<GeneratorDefinition | undefined>(() => {
    const slug = typeof route.params.slug === 'string'
      ? route.params.slug
      : undefined
    return slug ? findBySlug(slug) : undefined
  })

  return {
    generators,
    findBySlug,
    current,
  }
}
