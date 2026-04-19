import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { glyphWidth, stringWidth, SPACE_W } from '~/utils/axisWidths'

export type BoxAlignment = 'left' | 'center' | 'right'

export interface UseAsciiBoxOptions {
  /** Raw body text; newlines split into body lines. Trimmed & blank-dropped. */
  text: MaybeRefOrGetter<string>
  /** Horizontal alignment of each body line within the box. */
  alignment: MaybeRefOrGetter<BoxAlignment>
  /** Extra ━ added to the border beyond natural width. Body is padded to match. */
  extraWidth?: MaybeRefOrGetter<number>
  /** Extra empty body rows, split above and below the content. */
  extraHeight?: MaybeRefOrGetter<number>
  /** Lower bound on the dash count. Callers (e.g. kaomoji decoration) use this
   *  to reserve space for additional content drawn on top of the box. */
  minDashes?: MaybeRefOrGetter<number>
}

export interface AsciiBoxGeometry {
  /** Final macro lines (top border, body rows, bottom border). Top/bottom use
   *  plain ━ borders; decorations replace them externally. */
  lines: string[]
  /** Padded body inner strings (without the ┃ bars) — one per non-empty row. */
  bodyInnerLines: string[]
  /** Full body rows as emitted (┃…┃) including any empty padding rows. */
  bodyRows: string[]
  /** Top border string, e.g. ┏━━━━┓. */
  topBorder: string
  /** Default bottom border string, e.g. ┗━━━━┛. */
  bottomBorder: string
  /** Dash count in each border (excluding corners). */
  n: number
  /** Pixel width of the border (2*cornerW + n*dashW). */
  borderW: number
  /** Target inner pixel width each body line was padded to (before extras). */
  innerTarget: number
  /** Per-body-line actual inner widths after padding (with extras applied). */
  actualInnerWidths: number[]
  /** Max − min across body inner widths (parity residual; 0 when no drift). */
  variance: number
  /** |borderW − (2*vertW + maxInnerWidth)| — body/border alignment residual. */
  borderOffset: number
}

const DASH = '━'
const TOP_L = '┏'
const TOP_R = '┓'
const BOT_L = '┗'
const BOT_R = '┛'
const VERT = '┃'

/**
 * Build an ASCII chat box with pixel-accurate body alignment for the in-game
 * AXIS font. Picks an optimal (dash count, inner target) pair that minimises
 * line-to-line variance first, then border-vs-body offset. Pads each body line
 * with spaces to land exactly at its computed target width.
 *
 * The returned geometry is enough for a generator to render a plain box as-is
 * or swap in a custom bottom border / append decoration lines on top.
 */
export function useAsciiBox(opts: UseAsciiBoxOptions): ComputedRef<AsciiBoxGeometry> {
  return computed<AsciiBoxGeometry>(() => {
    const text = toValue(opts.text)
    const alignment = toValue(opts.alignment)
    const extraW = Math.max(0, Math.floor(toValue(opts.extraWidth ?? 0)))
    const extraH = Math.max(0, Math.floor(toValue(opts.extraHeight ?? 0)))
    const minDashes = Math.max(1, Math.floor(toValue(opts.minDashes ?? 1)))

    const body = text.split('\n').map(l => l.trimEnd())
    while (body.length && body[0] === '') body.shift()
    while (body.length && body[body.length - 1] === '') body.pop()

    const dashW   = glyphWidth(DASH)
    const cornerW = glyphWidth(TOP_L)
    const vertW   = glyphWidth(VERT)

    // No body → emit an empty geometry. The caller decides what to render.
    if (!body.length) {
      return {
        lines: [], bodyInnerLines: [], bodyRows: [],
        topBorder: '', bottomBorder: '',
        n: 0, borderW: 0, innerTarget: 0,
        actualInnerWidths: [], variance: 0, borderOffset: 0,
      }
    }

    // Each line's natural width with 1-space breathing room on each side.
    const lineWidths = body.map(l => stringWidth(` ${l} `))
    const widestContent = Math.max(...lineWidths)

    const minNfromContent = Math.max(1, Math.ceil((widestContent + 2 * vertW - 2 * cornerW) / dashW))
    const minN = Math.max(minNfromContent, minDashes)

    // Search (n, T) to minimise (variance, borderOffset) lexicographically.
    // For each candidate target T, each line rounds UP to the nearest reachable
    // width via ceil((T − sw) / SPACE_W) whole spaces — lines sharing T's
    // residue land exactly on T; others overshoot by 1 or 2 units.
    let best: {
      n: number
      innerTarget: number
      actualWidths: number[]
      variance: number
      borderOffset: number
    } | null = null
    for (let n = minN; n <= minN + 4; n++) {
      const borderW = 2 * cornerW + n * dashW
      const rawInner = borderW - 2 * vertW
      if (rawInner < widestContent) continue
      for (let T = widestContent; T <= rawInner + 2 * SPACE_W; T++) {
        const actualWidths = lineWidths.map(sw => {
          const deficit = Math.max(0, T - sw)
          const k = Math.ceil(deficit / SPACE_W)
          return sw + k * SPACE_W
        })
        const maxW = Math.max(...actualWidths)
        const minW = Math.min(...actualWidths)
        const variance = maxW - minW
        const maxBodyW = 2 * vertW + maxW
        const borderOffset = Math.abs(borderW - maxBodyW)
        if (
          !best
          || variance < best.variance
          || (variance === best.variance && borderOffset < best.borderOffset)
        ) {
          best = { n, innerTarget: T, actualWidths, variance, borderOffset }
        }
      }
    }

    // Apply extras: each ━ of extraWidth = +dashW to every body target AND +1
    // dash to the border. Empty rows for extraHeight share the widest actual
    // width so the right ┃ column stays straight.
    const extraPx = extraW * dashW
    const actualInnerWidths = best!.actualWidths.map(w => w + extraPx)
    const n = best!.n + extraW
    const borderW = 2 * cornerW + n * dashW
    const topBorder = `${TOP_L}${DASH.repeat(n)}${TOP_R}`
    const bottomBorder = `${BOT_L}${DASH.repeat(n)}${BOT_R}`

    const bodyInnerLines = body.map((l, i) => padLine(` ${l} `, actualInnerWidths[i]!, alignment))
    const maxInnerW = Math.max(...actualInnerWidths)
    const emptyInner = padLine(' ', maxInnerW, alignment)
    const emptyRow = `${VERT}${emptyInner}${VERT}`
    const halfAbove = Math.floor(extraH / 2)
    const halfBelow = extraH - halfAbove
    const bodyRows = [
      ...Array(halfAbove).fill(emptyRow),
      ...bodyInnerLines.map(p => `${VERT}${p}${VERT}`),
      ...Array(halfBelow).fill(emptyRow),
    ]

    return {
      lines: [topBorder, ...bodyRows, bottomBorder],
      bodyInnerLines,
      bodyRows,
      topBorder,
      bottomBorder,
      n,
      borderW,
      innerTarget: best!.innerTarget,
      actualInnerWidths,
      variance: best!.variance,
      borderOffset: best!.borderOffset,
    }
  })
}

/** Pad a string to the target pixel width using spaces, honoring alignment.
 *  Rounds to the nearest space count — may be off by up to ½ SPACE_W when the
 *  target isn't reachable (structural parity limit). */
export function padLine(line: string, targetWidth: number, alignment: BoxAlignment): string {
  const deficit = targetWidth - stringWidth(line)
  if (deficit <= 0) return line
  const n = Math.max(0, Math.round(deficit / SPACE_W))
  if (alignment === 'right')  return ' '.repeat(n) + line
  if (alignment === 'center') {
    const left = Math.floor(n / 2)
    return ' '.repeat(left) + line + ' '.repeat(n - left)
  }
  return line + ' '.repeat(n)
}
