<script setup lang="ts">
import { glyphWidth, stringWidth, SPACE_W } from '~/utils/axisWidths'
import { useAsciiBox, type BoxAlignment } from '~/composables/useAsciiBox'

const text = ref('')
const alignment = ref<BoxAlignment>('center')
const decoration = ref<string>('plain')
// Extra padding beyond natural box size. Width adds dashes; height adds empty rows.
const extraWidth = ref(0)
const extraHeight = ref(0)

const alignmentOptions = [
  { value: 'left',   icon: 'i-lucide-align-left'   },
  { value: 'center', icon: 'i-lucide-align-center' },
  { value: 'right',  icon: 'i-lucide-align-right'  },
] as const

// Each kaomoji variant shares the same `\` left hand + `ﾉ` right hand. The arm
// positions are auto-detected from each line so variants with different face
// widths all reuse the same ∩-tracking logic.
interface DecorationVariant {
  id: string
  preview: string          // shown in the select
  armLine: string | null   // null = plain box
}
const DECORATION_VARIANTS: DecorationVariant[] = [
  { id: 'plain',   preview: '┗━━━━┛',        armLine: null                      },
  { id: 'shy',     preview: '\\(´･ω･｀)ﾉ',    armLine: '  \\  (´･ω･｀)  ﾉ'        },
  { id: 'happy',   preview: '\\(´∀｀)ﾉ',      armLine: '  \\  (´∀｀)  ﾉ'          },
  { id: 'smile',   preview: '\\(＾ω＾)ﾉ',      armLine: '  \\  (＾ω＾)  ﾉ'          },
  { id: 'excited', preview: '\\(≧∇≦)ﾉ',      armLine: '  \\  (≧∇≦)  ﾉ'          },
  { id: 'smirk',   preview: '\\(￣ー￣)ﾉ',      armLine: '  \\  (￣ー￣)  ﾉ'          },
  { id: 'cry',     preview: '\\(ToT)ﾉ',      armLine: '  \\  (ToT)  ﾉ'          },
  { id: 'cheer',   preview: '\\(^o^)ﾉ',      armLine: '  \\  (^o^)  ﾉ'          },
  { id: 'content', preview: '\\(´ω｀)ﾉ',      armLine: '  \\  (´ω｀)  ﾉ'          },
  { id: 'wink',    preview: '\\(^_~)ﾉ',      armLine: '  \\  (^_~)  ﾉ'          },
  { id: 'cat',     preview: '\\(=ﾟωﾟ=)ﾉ',    armLine: '  \\  (=ﾟωﾟ=)  ﾉ'        },
  { id: 'yawn',    preview: '\\(´-ω-｀)ﾉ',    armLine: '  \\  (´-ω-｀)  ﾉ'        },
  { id: 'stars',   preview: '\\(★ω★)ﾉ',      armLine: '  \\  (★ω★)  ﾉ'          },
]

const currentDecoration = computed(() =>
  DECORATION_VARIANTS.find(v => v.id === decoration.value) ?? DECORATION_VARIANTS[0]!,
)
const activeArm = computed(() => {
  const line = currentDecoration.value.armLine
  if (!line) return null
  // Auto-detect arm centres by scanning the arm line. Any variant with `\` and
  // `ﾉ` at the same relative positions reuses the same ∩-tracking maths.
  let pos = 0
  let leftCenter = -1
  let rightCenter = -1
  for (const ch of line) {
    const w = glyphWidth(ch)
    if (ch === '\\' && leftCenter < 0) leftCenter = pos + w / 2
    else if (ch === 'ﾉ') rightCenter = pos + w / 2
    pos += w
  }
  return { line, leftCenter, rightCenter, width: pos }
})

const box = useAsciiBox({
  text,
  alignment,
  extraWidth,
  extraHeight,
  // Ensure the box is wide enough for the right ∩ (at borderW − 2*cornerW) to
  // reach the right-hand arm centre. Derived from the active kaomoji variant.
  minDashes: computed(() => {
    const arm = activeArm.value
    if (!arm) return 1
    const dashW = glyphWidth('━')
    const cornerW = glyphWidth('┏')
    const capW = glyphWidth('∩')
    const needed = arm.rightCenter - capW / 2 + 2 * cornerW  // ≥ borderW
    return Math.max(1, Math.ceil((needed - 2 * cornerW) / dashW))
  }),
})

// Swap in the kaomoji bottom border + append the arm line when active.
const layout = computed(() => {
  const g = box.value
  if (!g.lines.length) return { lines: [] as string[], variance: 0, borderOffset: 0 }
  const arm = activeArm.value
  if (!arm) return { lines: g.lines, variance: g.variance, borderOffset: g.borderOffset }

  const dashW   = glyphWidth('━')
  const cornerW = glyphWidth('┏')
  const capW    = glyphWidth('∩')

  // Search leading-space counts for the arm line that jointly minimise:
  //   1. arm-to-∩ alignment error (primary — this is what the user sees)
  //   2. arm-line centering offset (secondary)
  // ∩s must land on the dashW grid so they cannot perfectly align with arms
  // whose centre distance isn't a multiple of dashW — we just minimise the
  // residual.
  const { n, borderW } = g
  const minP = cornerW
  const maxP = borderW - 2 * cornerW
  const roundToGrid = (v: number) => Math.round(v / dashW) * dashW
  const maxLeading = Math.max(0, Math.floor((borderW - arm.width) / SPACE_W))

  let bestLeading = 0
  let bestScore: [number, number] = [Infinity, Infinity]
  for (let leading = 0; leading <= maxLeading; leading++) {
    const leadingPx = leading * SPACE_W
    const pL = clampSnap(leadingPx + arm.leftCenter  - capW / 2, minP, maxP, roundToGrid)
    const pR = clampSnap(leadingPx + arm.rightCenter - capW / 2, minP, maxP, roundToGrid)
    const [fL, fR] = fixOverlap(pL, pR, dashW, maxP)
    const alignError = Math.abs((fL + capW / 2) - (leadingPx + arm.leftCenter))
                     + Math.abs((fR + capW / 2) - (leadingPx + arm.rightCenter))
    const centerError = Math.abs((leadingPx + arm.width / 2) - borderW / 2)
    const score: [number, number] = [alignError, centerError]
    if (score[0] < bestScore[0]
        || (score[0] === bestScore[0] && score[1] < bestScore[1])) {
      bestScore = score
      bestLeading = leading
    }
  }

  const leadingPx = bestLeading * SPACE_W
  const armLineOut = ' '.repeat(bestLeading) + arm.line
  const pL0 = clampSnap(leadingPx + arm.leftCenter  - capW / 2, minP, maxP, roundToGrid)
  const pR0 = clampSnap(leadingPx + arm.rightCenter - capW / 2, minP, maxP, roundToGrid)
  const [pL, pR] = fixOverlap(pL0, pR0, dashW, maxP)

  const a = (pL - cornerW) / dashW              // ━s before left ∩
  const b = (pR - pL) / dashW - 1               // ━s between ∩
  const c = n - 2 - a - b                       // ━s after right ∩
  const bottomBorder = `┗${'━'.repeat(a)}∩${'━'.repeat(b)}∩${'━'.repeat(c)}┛`

  const lines = [...g.lines.slice(0, -1), bottomBorder, armLineOut]
  return { lines, variance: g.variance, borderOffset: g.borderOffset }
})

function clampSnap(px: number, lo: number, hi: number, snap: (v: number) => number): number {
  return Math.max(lo, Math.min(hi, snap(px)))
}
function fixOverlap(pL: number, pR: number, dashW: number, maxP: number): [number, number] {
  if (pR < pL + dashW) pR = pL + dashW
  if (pR > maxP) { pR = maxP; pL = Math.min(pL, pR - dashW) }
  return [pL, pR]
}

const lines = computed(() => layout.value.lines)
const hasDrift = computed(() =>
  layout.value.variance > 0 || layout.value.borderOffset > 0,
)

const { bgUrl, playerName, server, chatColor } = useChatPreviewConfig()
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-6 flex flex-col gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
          {{ $t('generators.alertBox.text') }}
        </span>
        <UTextarea
          v-model="text"
          :placeholder="$t('generators.alertBox.placeholder')"
          :rows="4"
          autoresize
          autocomplete="off"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
          {{ $t('generators.alertBox.decoration') }}
        </span>
        <USelectMenu
          v-model="decoration"
          :items="DECORATION_VARIANTS"
          value-key="id"
          :search-input="false"
          class="w-full"
        >
          <template #default>
            <pre class="font-mono text-[13px] leading-tight whitespace-pre">{{ currentDecoration.preview }}</pre>
          </template>
          <template #item-label="{ item }">
            <pre class="font-mono text-[13px] leading-tight whitespace-pre">{{ item.preview }}</pre>
          </template>
        </USelectMenu>
      </label>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
          {{ $t('generators.alertBox.alignment') }}
        </span>
        <div class="inline-flex gap-1 rounded-md bg-black/20 p-1 w-fit">
          <UButton
            v-for="opt in alignmentOptions"
            :key="opt.value"
            :icon="opt.icon"
            :color="alignment === opt.value ? 'primary' : 'neutral'"
            :variant="alignment === opt.value ? 'soft' : 'ghost'"
            size="sm"
            :aria-label="$t(`generators.alertBox.align.${opt.value}`)"
            :aria-pressed="alignment === opt.value"
            @click="alignment = opt.value"
          />
        </div>
      </div>

      <div class="flex gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
            {{ $t('generators.alertBox.extraWidth') }}
          </span>
          <UInputNumber v-model="extraWidth" :min="0" :max="30" class="w-32" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs uppercase tracking-[0.2em] text-gold-dim">
            {{ $t('generators.alertBox.extraHeight') }}
          </span>
          <UInputNumber v-model="extraHeight" :min="0" :max="10" class="w-32" />
        </label>
      </div>
    </div>

    <UAlert
      v-if="hasDrift"
      icon="i-lucide-info"
      color="primary"
      variant="subtle"
      class="mb-4"
      :title="$t('generators.alertBox.drift.title')"
      :description="$t('generators.alertBox.drift.description')"
    />

    <ClientOnly>
      <ChatPreview
        :lines="lines"
        :bg-url="bgUrl"
        :player-name="playerName"
        :server="server"
        :chat-color="chatColor"
      />
    </ClientOnly>

    <MacroOutput :lines="lines" class="mt-6" />
  </div>
</template>
