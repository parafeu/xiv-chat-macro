<script setup lang="ts">
interface NuxtError {
  statusCode?: number
  statusMessage?: string
  message?: string
}
defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

function clearAndGoHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-[var(--color-bg-base)] to-[var(--color-bg-deep)]">
    <div class="max-w-md text-center">
      <div class="text-[var(--color-gold)] text-5xl mb-3">⚜</div>
      <div class="mb-4"><OrnamentalDivider /></div>
      <h1 class="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text-primary)]">
        {{ error.statusCode === 404 ? t('error.notFound.title') : t('error.generic.title') }}
      </h1>
      <p v-if="error.statusCode === 404" class="mt-3 text-sm text-[var(--color-text-muted)]">
        {{ t('error.notFound.description') }}
      </p>
      <div class="mt-6">
        <UButton color="primary" variant="solid" icon="i-lucide-arrow-left" @click="clearAndGoHome">
          {{ error.statusCode === 404 ? t('error.notFound.action') : t('error.generic.action') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
