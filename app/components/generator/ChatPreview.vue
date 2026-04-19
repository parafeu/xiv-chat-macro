<script setup lang="ts">
import type { Ff14ColorKey } from '~/constants/ff14Palette'
import { varRefFor } from '~/constants/ff14Palette'
import { AXIS_SIZE, glyphWidth } from '~/utils/axisWidths'

// Display the chat at 13px while widths live at AXIS native size. Scale keeps
// proportions consistent while honoring exact glyph-to-glyph ratios.
const SCALE = 13 / AXIS_SIZE
function glyphWidthPx(ch: string): number {
  return glyphWidth(ch) * SCALE
}

// Natural Overpass width measurement (client-only). We stretch box-drawing
// glyphs horizontally so their rendered bitmap fills the Jupiter-width cell
// — otherwise `━` shows gaps because its Overpass glyph is narrower than
// the Jupiter advance we force on it.
function makeMeasurer() {
  if (!import.meta.client) return null
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null
  ctx.font = '13px Overpass, ui-sans-serif, system-ui, sans-serif'
  return ctx
}
const measurer = makeMeasurer()
const overpassCache = new Map<string, number>()
function overpassWidth(ch: string): number {
  if (!measurer) return 0
  const cached = overpassCache.get(ch)
  if (cached !== undefined) return cached
  const w = measurer.measureText(ch).width
  overpassCache.set(ch, w)
  return w
}

// Flip after fonts finish loading so the measurements use real Overpass
// metrics rather than a system fallback. Triggers a reactive recompute.
const fontsReady = ref(false)
onMounted(() => {
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready.then(() => {
      overpassCache.clear()
      fontsReady.value = true
    })
  }
})

function glyphs(s: string): Array<{ ch: string, px: number, scaleX: number }> {
  // Touch fontsReady so this recomputes when fonts finish loading.
  void fontsReady.value
  return Array.from(s).map(ch => {
    const px = glyphWidthPx(ch)
    let scaleX = 1
    if (measurer) {
      const natural = overpassWidth(ch)
      // Stretch / compress each glyph to fill its Jupiter-sized cell.
      // Keeps both pixel-accurate alignment AND visually tight spacing.
      if (natural > 0.5) scaleX = px / natural
    }
    return { ch, px, scaleX }
  })
}

interface Props {
  /** Lines to render as chat messages (one per entry). */
  lines?: string[]
  /** URL of the in-game screenshot used as the backdrop. Empty = neutral fallback. */
  bgUrl?: string
  /** Demo character name shown before each message. */
  playerName?: string
  /** Demo character's server / world name. */
  server?: string
  /** FF14 palette key for the message color. Omit to inherit the default --color-chat. */
  chatColor?: Ff14ColorKey
}
const props = withDefaults(defineProps<Props>(), {
  lines: () => [],
  bgUrl: '',
  playerName: '',
  server: '',
  chatColor: undefined,
})

const hasBg = computed(() => !!props.bgUrl)
const hasLines = computed(() => !!props.lines.length)

// "PlayerName (Server)" prefix used on every line. Empty string if neither is set.
const sender = computed(() => {
  if (!props.playerName) return ''
  return props.server ? `${props.playerName} (${props.server})` : props.playerName
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-md"
    :class="hasBg ? '' : 'bg-default'"
    :style="{
      ...(hasBg ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
      ...(chatColor ? { '--color-chat': varRefFor(chatColor) } : {}),
    }"
  >
    <div class="p-12">
      <!-- relative wrapper: sized by the text content div below; the backdrop fills it via absolute inset-0 -->
      <div class="relative">
        <!--
          Dark panel backdrop. filter:blur feathers ONLY this element's edges.
          The text on top stays crisp because it's a separate layer, not filtered.
        -->
        <div
          aria-hidden="true"
          class="absolute inset-0 rounded-lg"
          style="background-color: rgba(0, 0, 0, 0.6); filter: blur(2px);"
        />

        <!-- Fake scrollbar: purely decorative, mimics the FF14 chat rail + gold thumb. -->
        <div
          aria-hidden="true"
          class="absolute top-2 bottom-2 left-2 w-[2px] rounded-full"
          style="background-color: rgba(255, 255, 255, 0.08);"
        >
          <div
            class="absolute inset-x-0 bottom-0 h-1/2 rounded-full bg-gold-bright"
          />
        </div>

        <!-- Text, crisp, above the feathered backdrop -->
        <div class="relative py-3 pl-5 pr-4 font-chat text-[13px] leading-[1.4] text-white">
          <div v-if="hasLines">
            <div
              v-for="(line, i) in lines"
              :key="i"
              class="whitespace-pre"
            >
              <!-- Timestamp stays in natural Overpass rendering. -->
              <span class="text-white">[13:37]</span>
              <!-- Message body: each glyph gets its AXIS_14 advance width so
                   box edges align exactly as they will in-game. -->
              <span class="text-chat"><span
                v-for="(g, j) in glyphs(' ' + (sender ? sender + ' ' : '') + line)"
                :key="j"
                class="inline-block align-baseline whitespace-pre"
                :style="{
                  width: g.px + 'px',
                  transform: g.scaleX !== 1 ? `scaleX(${g.scaleX})` : undefined,
                  transformOrigin: g.scaleX !== 1 ? 'left center' : undefined,
                }"
              >{{ g.ch }}</span></span>
            </div>
          </div>
          <div v-else class="italic text-white/60">
            {{ $t('preview.empty') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
