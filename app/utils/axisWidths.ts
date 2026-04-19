import ff14Widths from '~/constants/ff14FontWidths.json'

// AXIS is the in-game chat font (default size 12pt). Widths are in pixels at
// the font's native point size. Missing glyphs fall back to the space width so
// that unknown characters don't crash the algorithm — they just render at
// space-width in our calculations.
const WIDTHS = ff14Widths.widths as Record<string, number>

/** Width of a normal space character in the extracted AXIS font. */
export const SPACE_W = WIDTHS[String(' '.charCodeAt(0))] ?? 3

/** Native point size of the extracted font (e.g. 12 for AXIS_12). */
export const AXIS_SIZE = ff14Widths.size as number

/** Pixel advance width of a single glyph. Falls back to space width. */
export function glyphWidth(ch: string): number {
  return WIDTHS[String(ch.charCodeAt(0))] ?? SPACE_W
}

/** Pixel advance width of a full string, summing each glyph's advance. */
export function stringWidth(s: string): number {
  let w = 0
  for (const ch of s) w += glyphWidth(ch)
  return w
}
