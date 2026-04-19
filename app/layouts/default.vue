<script setup lang="ts">
import AppFooter from '~/components/app/AppFooter.vue'

const drawerOpen = ref(false)
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <AppHeader :on-open-menu="() => drawerOpen = true" />
    <div class="flex flex-1 min-h-0">
      <AppSidebar />
      <main class="flex-1 min-w-0 overflow-y-auto flex flex-col">
        <div class="flex-1 px-4 md:px-8 py-6 md:py-8">
          <slot />
        </div>
        <AppFooter />
      </main>
    </div>
    <AppMobileDrawer v-model="drawerOpen" />
    <UToaster />
  </div>
</template>
