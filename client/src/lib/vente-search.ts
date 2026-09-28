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
