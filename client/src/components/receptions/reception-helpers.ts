import type { Lot, Product, Reception, ReceptionLine, Supplier } from '@/types'

export function entityId(ref: { _id: string } | string | null | undefined): string {
  if (!ref) return ''
  return typeof ref === 'string' ? ref : ref._id
}

export function asProduct(ref: ReceptionLine['product']): Product | null {
  if (!ref || typeof ref === 'string') return null
  return ref
}

export function asLot(ref: ReceptionLine['lot']): Lot | null {
  if (!ref || typeof ref === 'string') return null
  return ref
}

export function asSupplier(ref: Reception['supplier']): Supplier | null {
  if (!ref || typeof ref === 'string') return null
  return ref
}

export function lineProductLotLabel(line: ReceptionLine): string {
  const product = asProduct(line.product)
  const lot = asLot(line.lot)
  const productLabel = product ? `${product.code} - ${product.name}` : ''
  const lotLabel = lot ? `${lot.code} - ${lot.name}` : ''
  return [productLabel, lotLabel].filter(Boolean).join(' / ')
}

export function receptionLinesLabel(reception: Reception): string {
  return reception.lines.map(lineProductLotLabel).filter(Boolean).join(', ')
}

export function receptionLineSearchFields(reception: Reception): Array<string | number> {
  return reception.lines.flatMap((line) => {
    const product = asProduct(line.product)
    const lot = asLot(line.lot)
    return [
      product?.code ?? '',
      product?.name ?? '',
      lot?.code ?? '',
      lot?.name ?? '',
      line.buyPrice,
      line.sellPrice,
    ]
  })
}

/** Supplier on the newest reception. The list API returns newest first. */
export function latestSupplierId(receptions: Reception[]): string {
  return entityId(receptions[0]?.supplier)
}

/** Buy and sell price from the last matching line on the newest reception that contains the product. */
export function latestPricesForProduct(
  receptions: Reception[],
  productId: string
): { buyPrice: string; sellPrice: string; allowPriceChange: boolean } | null {
  if (!productId) return null
  for (const reception of receptions) {
    const matches = reception.lines.filter((line) => entityId(line.product) === productId)
    const line = matches[matches.length - 1]
    if (!line) continue
    return {
      buyPrice: String(line.buyPrice),
      sellPrice: String(line.sellPrice),
      allowPriceChange: line.allowPriceChange !== false,
    }
  }
  return null
}

/** First active lot in list order (API sorts by name); used as default on new reception lines. */
export function defaultLotIdFromLots(lots: Lot[]): string {
  const active = lots.filter((l) => l.isActive)
  return (active[0] ?? lots[0])?._id ?? ''
}

export type ReceptionLineDraft = {
  key: string
  product: string
  lot: string
  quantity: string
  status: 'A' | 'R'
  buyPrice: string
  sellPrice: string
  allowPriceChange: boolean
  expiryDate: string
  observation: string
}

export function emptyLineDraft(defaultLotId = ''): ReceptionLineDraft {
  return {
    key: crypto.randomUUID(),
    product: '',
    lot: defaultLotId,
    quantity: '1',
    status: 'A',
    buyPrice: '',
    sellPrice: '',
    allowPriceChange: true,
    expiryDate: '',
    observation: '',
  }
}

export type ReceptionMoney = {
  buy: number
  sell: number
  difference: number
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

/** Profit margin on the buy price: (sell − buy) / buy. */
export function profitMarginPercent(buyPrice: number, sellPrice: number): number | null {
  if (!Number.isFinite(buyPrice) || buyPrice <= 0 || !Number.isFinite(sellPrice)) return null
  return Math.round((((sellPrice - buyPrice) / buyPrice) * 100) * 100) / 100
}

export function sellPriceFromMargin(buyPrice: number, marginPercent: number): number | null {
  if (!Number.isFinite(buyPrice) || buyPrice <= 0 || !Number.isFinite(marginPercent)) return null
  return Math.max(0, roundMoney((buyPrice * (100 + marginPercent)) / 100))
}

export function formatMarginInput(buyPrice: number, sellPrice: number): string {
  const margin = profitMarginPercent(buyPrice, sellPrice)
  return margin === null ? '' : String(margin)
}

const marginLabelFormat = new Intl.NumberFormat('fr-DZ', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatMarginLabel(buyPrice: number, sellPrice: number): string {
  const margin = profitMarginPercent(buyPrice, sellPrice)
  return margin === null ? '-' : `${marginLabelFormat.format(margin)} %`
}

export function parseMarginInput(raw: string): number | null {
  const cleaned = raw.trim().replace('%', '').replace(/\s/g, '').replace(',', '.')
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

export function receptionMoney(quantity: number, buyPrice: number, sellPrice: number): ReceptionMoney {
  const buy = roundMoney((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(buyPrice) ? buyPrice : 0))
  const sell = roundMoney((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(sellPrice) ? sellPrice : 0))
  return { buy, sell, difference: roundMoney(sell - buy) }
}

export function draftReceptionMoney(line: Pick<ReceptionLineDraft, 'quantity' | 'buyPrice' | 'sellPrice'>): ReceptionMoney {
  return receptionMoney(Number(line.quantity), Number(line.buyPrice), Number(line.sellPrice))
}

export function sumReceptionMoney(parts: ReceptionMoney[]): ReceptionMoney {
  return parts.reduce(
    (sum, part) => ({
      buy: roundMoney(sum.buy + part.buy),
      sell: roundMoney(sum.sell + part.sell),
      difference: roundMoney(sum.difference + part.difference),
    }),
    { buy: 0, sell: 0, difference: 0 }
  )
}

export function lineToDraft(line: ReceptionLine): ReceptionLineDraft {
  const expiry = line.expiryDate ? line.expiryDate.slice(0, 10) : ''
  return {
    key: line._id || crypto.randomUUID(),
    product: entityId(line.product),
    lot: entityId(line.lot),
    quantity: String(line.quantity),
    status: line.status,
    buyPrice: String(line.buyPrice),
    sellPrice: String(line.sellPrice),
    allowPriceChange: line.allowPriceChange !== false,
    expiryDate: expiry,
    observation: line.observation || '',
  }
}
