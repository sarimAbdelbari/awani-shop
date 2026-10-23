export function fold(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function wildcardTokens(query: string) {
  return fold(query)
    .split('*')
    .map((token) => token.trim())
    .filter(Boolean)
}

export function matchWildcard(query: string, haystack: string) {
  const tokens = wildcardTokens(query)
  if (tokens.length === 0) return false
  const hay = fold(haystack)
  return tokens.every((token) => hay.includes(token))
}

export function searchRank(query: string, code: string, name: string) {
  const first = wildcardTokens(query)[0] ?? ''
  if (!first) return 2
  if (fold(code).startsWith(first)) return 0
  if (fold(name).startsWith(first)) return 1
  return 2
}

export type PileSearchFields = {
  name: boolean
  supplier: boolean
  quantity: boolean
  price: boolean
}

export type PileSearchTarget = {
  code: string
  name: string
  supplier: string
  quantity: string
  prices: string[]
}

function commaTerms(query: string) {
  return query
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function enabledValues(target: PileSearchTarget, fields: PileSearchFields) {
  const values: string[] = []
  if (fields.name) values.push(target.code, target.name)
  if (fields.supplier) values.push(target.supplier)
  if (fields.quantity) values.push(target.quantity)
  if (fields.price) values.push(...target.prices)
  return values.map(fold)
}

function termMatches(term: string, values: string[]) {
  const pieces = wildcardTokens(term)
  if (pieces.length === 0 || values.length === 0) return false
  return values.some((value) => pieces.every((piece) => value.includes(piece)))
}

export function matchPileQuery(query: string, target: PileSearchTarget, fields: PileSearchFields) {
  const terms = commaTerms(query)
  if (terms.length === 0) return false
  const values = enabledValues(target, fields)
  return terms.every((term) => termMatches(term, values))
}

function prefixRank(query: string, target: PileSearchTarget, fields: PileSearchFields) {
  const needle = wildcardTokens(commaTerms(query)[0] ?? '')[0] ?? ''
  if (!needle) return 1
  const values = enabledValues(target, fields)
  return values.some((value) => value.startsWith(needle)) ? 0 : 1
}

export function comparePileSearch(
  query: string,
  a: PileSearchTarget,
  b: PileSearchTarget,
  fields: PileSearchFields
) {
  const byRank = prefixRank(query, a, fields) - prefixRank(query, b, fields)
  if (byRank !== 0) return byRank
  const byName = fold(a.name).localeCompare(fold(b.name), 'fr')
  if (byName !== 0) return byName
  const bySupplier = fold(a.supplier).localeCompare(fold(b.supplier), 'fr')
  if (bySupplier !== 0) return bySupplier
  return fold(a.code).localeCompare(fold(b.code), 'fr')
}

export function parseQty(raw: string) {
  const text = raw.trim()
  if (!/^\d+$/.test(text)) return null
  const qty = Number(text)
  if (!Number.isInteger(qty) || qty < 1) return null
  return qty
}

export function parseMoney(raw: string) {
  const text = raw.trim().replace(/\s/g, '')
  if (!/^\d+([.,]\d+)?$/.test(text)) return null
  const amount = Number(text.replace(',', '.'))
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * 100) / 100
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 2,
  }).format(value)
}
