<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { FF14_PALETTE_KEYS, varRefFor, type Ff14ColorKey } from '~/constants/ff14Palette'
import { FF14_WORLD_SELECT_ITEMS } from '~/constants/ff14Worlds'

const { t } = useI18n()
const settings = useSettingsStore()
const { playerName, server, chatColor } = storeToRefs(settings)

useHead({
  title: () => `${t('app.settings')} · ${t('app.brand')}`,
})

function pickColor(key: Ff14ColorKey) {
  settings.setChatColor(key)
}
</script>

<template>
  <div class="max-w-2xl">
    <SectionLabel>{{ $t('app.settings') }}</SectionLabel>
    <h1 class="text-3xl text-highlighted">
      {{ $t('app.settings') }}
    </h1>
    <div class="my-6">
      <OrnamentalDivider />
    </div>

    <!-- Identity -->
    <section class="mb-10">
      <h2 class="text-xl text-highlighted">
        {{ $t('settings.identity.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted">
        {{ $t('settings.identity.description') }}
      </p>

      <!-- ClientOnly: inputs v-model onto persisted store state. -->
      <ClientOnly>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
              {{ $t('settings.identity.playerName') }}
            </span>
            <UInput v-model="playerName" placeholder="Warrior of Light" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
              {{ $t('settings.identity.server') }}
            </span>
            <USelectMenu
              v-model="server"
              :items="FF14_WORLD_SELECT_ITEMS"
              value-key="value"
              placeholder="Moogle"
            />
          </label>
        </div>
      </ClientOnly>
    </section>

    <!-- Preview -->
    <section>
      <h2 class="text-xl text-highlighted">
        {{ $t('settings.preview.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted">
        {{ $t('settings.preview.description') }}
      </p>

      <div class="mt-4">
        <div class="text-xs uppercase tracking-[0.2em] text-gold-dim mb-2">
          {{ $t('settings.preview.chatColor') }}
        </div>
        <!-- ClientOnly: active swatch state depends on the persisted store. -->
        <ClientOnly>
          <div
            class="grid w-fit gap-1 rounded-md bg-black/40 p-2"
            style="grid-template-columns: repeat(8, 2.25rem);"
          >
            <button
              v-for="key in FF14_PALETTE_KEYS"
              :key="key"
              type="button"
              class="aspect-square rounded-sm ring-1 ring-black/30 transition-[box-shadow,transform] focus-visible:outline-none hover:scale-110"
              :class="chatColor === key
                ? 'ring-2 ring-white shadow-[0_0_0_2px_var(--color-bg-base),0_0_0_4px_var(--color-gold)]'
                : ''"
              :style="{ backgroundColor: varRefFor(key) }"
              :title="key"
              :aria-pressed="chatColor === key"
              @click="pickColor(key)"
            />
          </div>
          <p class="mt-2 font-mono text-xs text-muted">
            {{ chatColor }}
          </p>
        </ClientOnly>
      </div>
    </section>
  </div>
</template>
