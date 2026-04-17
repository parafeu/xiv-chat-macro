# Generators

Each subfolder here is one generator. The app picks them up automatically — the sidebar, the home grid, and the `/[slug]` route all iterate over `registry.ts`.

## How to add a generator

1. Create a folder: `app/generators/my-generator/`
2. Add `index.ts` exporting a default `GeneratorDefinition`:

   ```ts
   import type { GeneratorDefinition } from '~/types/generator'

   export default {
     id: 'my-generator',
     slug: 'my-generator',
     order: 10,
     icon: 'i-lucide-square-code',
     titleKey: 'generators.myGenerator.title',
     descriptionKey: 'generators.myGenerator.description',
     component: () => import('./Generator.vue'),
   } satisfies GeneratorDefinition
   ```

3. Add `Generator.vue` with your UI and logic.
4. Add matching i18n keys to `i18n/locales/en.json` and `fr.json`.

That is all. No shell code changes required.
