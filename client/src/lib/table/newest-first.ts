/** Copy of `rows` with the latest timestamp first. Missing dates stay at the end. */
export function newestFirst<T>(
  rows: readonly T[],
  getTimestamp: (row: T) => string | null | undefined
): T[] {
  return [...rows].sort((a, b) => {
    const latest = timeOf(getTimestamp(b))
    const earlier = timeOf(getTimestamp(a))
    return latest - earlier
  })
}

function timeOf(value: string | null | undefined): number {
  const time = Date.parse(value ?? '')
  return Number.isNaN(time) ? 0 : time
}
