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
  <div class="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-muted to-default">
    <div class="max-w-md text-center">
      <img src="/logo.png" :alt="t('app.brand')" class="mx-auto mb-3 h-16 w-auto">

      <div class="mb-4"><OrnamentalDivider /></div>
      <h1 class="text-4xl text-highlighted">
        {{ error.statusCode === 404 ? t('error.notFound.title') : t('error.generic.title') }}
      </h1>
      <p v-if="error.statusCode === 404" class="mt-3 text-sm text-muted">
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
