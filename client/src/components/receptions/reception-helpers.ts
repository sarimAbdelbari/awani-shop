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

export type ReceptionLineDraft = {
  key: string
  product: string
  lot: string
  quantity: string
  status: 'A' | 'R'
  buyPrice: string
  sellPrice: string
  expiryDate: string
  observation: string
}

export function emptyLineDraft(): ReceptionLineDraft {
  return {
    key: crypto.randomUUID(),
    product: '',
    lot: '',
    quantity: '1',
    status: 'A',
    buyPrice: '',
    sellPrice: '',
    expiryDate: '',
    observation: '',
  }
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
    expiryDate: expiry,
    observation: line.observation || '',
  }
}
