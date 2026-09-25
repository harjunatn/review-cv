type PdfTextItem = {
  str: string
  transform: unknown[]
  hasEOL?: boolean
}

function isTextItem(item: unknown): item is PdfTextItem {
  return !!item && typeof item === 'object' && 'str' in item && typeof item.str === 'string'
}

export function itemsToText(items: readonly unknown[]): string {
  const lines: string[] = []
  let line = ''
  let lastY: number | null = null

  for (const item of items) {
    if (!isTextItem(item)) continue
    const y = typeof item.transform[5] === 'number' ? item.transform[5] : null
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && line.trim()) {
      lines.push(line.trim())
      line = ''
    }
    if (item.str) line += `${item.str} `
    if (item.hasEOL && line.trim()) {
      lines.push(line.trim())
      line = ''
    }
    if (y !== null) lastY = y
  }

  if (line.trim()) lines.push(line.trim())
  return lines.join('\n')
}
