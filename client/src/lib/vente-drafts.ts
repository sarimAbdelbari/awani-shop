import type { Client } from '@/types'

export type DraftLine = {
  key: string
  productId: string
  lotId: string
  supplierId: string
  productCode: string
  productName: string
  lotCode: string
  lotName: string
  supplierName: string
  catalogPrice: number
  unitPrice: number
  qty: number
}

export type DraftTicket = {
  client: Client | null
  lines: DraftLine[]
}

const STORAGE_KEY = 'awani_vente_drafts_v1'

export function pileKey(productId: string, lotId: string, supplierId: string) {
  return `${productId}|${lotId}|${supplierId}`
}

export function emptyTicket(): DraftTicket {
  return { client: null, lines: [] }
}

export function emptyTickets(): DraftTicket[] {
  return [emptyTicket(), emptyTicket(), emptyTicket(), emptyTicket()]
}

export function ticketTotal(ticket: DraftTicket) {
  return Math.round(ticket.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0) * 100) / 100
}

export function reservedQty(tickets: DraftTicket[], key: string, excludeLineKey?: string) {
  return tickets.reduce(
    (sum, ticket) =>
      sum +
      ticket.lines.reduce((lineSum, line) => {
        if (excludeLineKey && line.key === excludeLineKey) return lineSum
        if (pileKey(line.productId, line.lotId, line.supplierId) !== key) return lineSum
        return lineSum + line.qty
      }, 0),
    0
  )
}

function isClient(value: unknown): value is Client {
  if (!value || typeof value !== 'object') return false
  const client = value as Client
  return typeof client._id === 'string' && typeof client.fullName === 'string'
}

function isLine(value: unknown): value is DraftLine {
  if (!value || typeof value !== 'object') return false
  const line = value as DraftLine
  return (
    typeof line.key === 'string' &&
    typeof line.productId === 'string' &&
    typeof line.lotId === 'string' &&
    typeof line.supplierId === 'string' &&
    typeof line.qty === 'number' &&
    line.qty >= 1 &&
    typeof line.unitPrice === 'number' &&
    typeof line.catalogPrice === 'number'
  )
}

export function loadDrafts(): { active: number; tickets: DraftTicket[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { active?: unknown; tickets?: unknown }
    if (!Array.isArray(parsed.tickets) || parsed.tickets.length !== 4) return null
    const tickets = parsed.tickets.map((ticket) => {
      const draft = ticket as DraftTicket
      return {
        client: isClient(draft?.client) ? draft.client : null,
        lines: Array.isArray(draft?.lines) ? draft.lines.filter(isLine) : [],
      }
    })
    const active = typeof parsed.active === 'number' && parsed.active >= 0 && parsed.active < 4
      ? parsed.active
      : 0
    return { active, tickets }
  } catch {
    return null
  }
}

export function saveDrafts(active: number, tickets: DraftTicket[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ active, tickets }))
}
