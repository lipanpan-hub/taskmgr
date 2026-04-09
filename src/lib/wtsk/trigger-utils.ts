export function normalizeStartTime(startTime: string, now = new Date()): string {
  const trimmed = startTime.trim()

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day} ${trimmed}`
  }

  return trimmed
}

export function parseNumberList(
  value: string,
  label: string,
  {max, min}: {max: number; min: number},
): number[] {
  const numbers = value.split(',').map(part => Number(part.trim()))

  if (numbers.length === 0 || numbers.some(number => Number.isNaN(number) || !Number.isInteger(number))) {
    throw new Error(`${label} 必须是逗号分隔的整数列表`)
  }

  if (numbers.some(number => number < min || number > max)) {
    throw new Error(`${label} 必须在 ${min}-${max} 范围内`)
  }

  return numbers
}
