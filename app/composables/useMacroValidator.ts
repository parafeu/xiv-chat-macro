import { computed, toValue, type MaybeRefOrGetter } from 'vue'

const MAX_LINES = 15
const MAX_CHARS_PER_LINE = 180

export interface MacroValidation {
  lineCount: number
  charCounts: number[]
  maxCharCount: number
  isValid: boolean
  warnings: string[]
}

export function useMacroValidator(lines: MaybeRefOrGetter<string[]>) {
  const validation = computed<MacroValidation>(() => {
    const rawLines = toValue(lines)
    const lineCount = rawLines.length
    const charCounts = rawLines.map(l => l.length)
    const maxCharCount = charCounts.length > 0 ? Math.max(...charCounts) : 0
    const warnings: string[] = []

    if (lineCount > MAX_LINES) {
      warnings.push(`Too many lines: ${lineCount} / ${MAX_LINES}`)
    }
    const overLongLines = charCounts.filter(c => c > MAX_CHARS_PER_LINE).length
    if (overLongLines > 0) {
      warnings.push(`${overLongLines} line(s) exceed ${MAX_CHARS_PER_LINE} characters`)
    }

    return {
      lineCount,
      charCounts,
      maxCharCount,
      isValid: warnings.length === 0,
      warnings,
    }
  })

  return {
    validation,
    MAX_LINES,
    MAX_CHARS_PER_LINE,
  }
}
