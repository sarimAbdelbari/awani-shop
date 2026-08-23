import type { Row } from '@tanstack/react-table'

/** Split query into tokens; every token must match somewhere in the joined fields. */
export function matchAllTokensInFields(
  fields: Array<string | number | null | undefined>,
  query: unknown
): boolean {
  const q = String(query ?? '')
    .trim()
    .toLowerCase()
  if (!q) return true

  const haystack = fields
    .map((f) => String(f ?? '').toLowerCase())
    .join(' ')

  return q.split(/\s+/).every((token) => haystack.includes(token))
}

export const columnTextFilterFn = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: unknown
): boolean => {
  const q = String(filterValue ?? '')
    .trim()
    .toLowerCase()
  if (!q) return true
  const raw = row.getValue(columnId)
  return String(raw ?? '')
    .toLowerCase()
    .includes(q)
}

export function makeGlobalFilterFn<T>(
  getFields: (row: T) => Array<string | number | null | undefined>
) {
  return (row: Row<T>, _columnId: string, filterValue: unknown) =>
    matchAllTokensInFields(getFields(row.original), filterValue)
}
