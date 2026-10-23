import { useEffect, useRef, useState } from 'react'

import { CashStep } from '@/components/vente/cash-step'
import { SlotBar } from '@/components/vente/slot-bar'
import { TicketForm, type CaisseActions } from '@/components/vente/ticket-form'
import { TicketPrint } from '@/components/vente/ticket-print'
import { clientApi, orderApi, productApi, settingsApi, shiftApi, stockApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useI18n } from '@/i18n'
import {
  emptyTicket,
  emptyTickets,
  loadDrafts,
  linePileKey,
  pileKey,
  reservedQty,
  saveDrafts,
  ticketTotal,
  type DraftTicket,
} from '@/lib/vente-drafts'
import { parseMoney } from '@/lib/vente-search'
import type { Client, Order, Product, StockPosition } from '@/types'
import { error_toast, sucess_toast } from '@/utils/toastNotification'

export function Caisse() {
  const { t } = useI18n()
  const actionsRef = useRef<CaisseActions>({
    focusProduct: () => undefined,
    newClient: () => undefined,
    escape: () => undefined,
    validate: () => undefined,
  })
  const activeRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(0)
  const [tickets, setTickets] = useState<DraftTicket[]>(emptyTickets)
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [positions, setPositions] = useState<StockPosition[]>([])
  const [shopName, setShopName] = useState('Awani Shop')
  const [loading, setLoading] = useState(true)
  const savingRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [altHeld, setAltHeld] = useState(false)
  const [printOrder, setPrintOrder] = useState<Order | null>(null)
  const [shiftOpen, setShiftOpen] = useState(false)
  const shiftOpenRef = useRef(false)
  const cashRef = useRef<{ index: number; ticket: DraftTicket; total: number } | null>(null)
  const [cashOpen, setCashOpen] = useState(false)
  const [cashTotal, setCashTotal] = useState(0)
  const [receivedText, setReceivedText] = useState('')

  useEffect(() => {
    const stored = loadDrafts()
    if (stored) {
      setActive(stored.active)
      setTickets(stored.tickets)
      activeRef.current = stored.active
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveDrafts(active, tickets)
  }, [active, tickets, ready])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      productApi.list({ active: 'true' }),
      clientApi.list(),
      stockApi.positions(),
      settingsApi.get(),
      shiftApi.current(),
    ])
      .then(([nextProducts, nextClients, nextPositions, settings, shift]) => {
        if (cancelled) return
        setProducts(nextProducts)
        setClients(nextClients)
        setPositions(nextPositions)
        setShopName(settings.shopName || 'Awani Shop')
        setShiftOpen(Boolean(shift.shift))
        shiftOpenRef.current = Boolean(shift.shift)
      })
      .catch((err) => {
        if (!cancelled) error_toast(getApiErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || loading) return
    const frame = requestAnimationFrame(() => actionsRef.current.focusProduct())
    return () => cancelAnimationFrame(frame)
  }, [active, ready, loading])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (cashRef.current && ['F1', 'F2', 'F3', 'F4', 'F8', 'F9'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      const slotKey = ['F1', 'F2', 'F3', 'F4'].includes(event.key)
      if (slotKey) {
        event.preventDefault()
        event.stopPropagation()
        if (event.type !== 'keydown' || event.repeat) return
        const index = Number(event.key.slice(1)) - 1
        if (index === activeRef.current) actionsRef.current.focusProduct()
        else {
          activeRef.current = index
          setActive(index)
        }
        return
      }
      if (event.key === 'F8') {
        event.preventDefault()
        event.stopPropagation()
        if (event.type === 'keydown' && !event.repeat) actionsRef.current.newClient()
        return
      }
      if (event.key === 'F9') {
        event.preventDefault()
        event.stopPropagation()
        if (event.type === 'keydown' && !event.repeat) actionsRef.current.validate()
        return
      }
      if (event.key === 'Escape' && event.type === 'keydown') {
        event.preventDefault()
        event.stopPropagation()
        if (cashRef.current) {
          if (savingRef.current) return
          cashRef.current = null
          setCashOpen(false)
          return
        }
        actionsRef.current.escape()
        return
      }
      if (event.key === 'Alt') {
        event.preventDefault()
        setAltHeld(event.type === 'keydown')
      }
    }
    const clearAlt = () => setAltHeld(false)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKey, true)
    window.addEventListener('blur', clearAlt)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKey, true)
      window.removeEventListener('blur', clearAlt)
    }
  }, [])

  useEffect(() => {
    if (!printOrder) return
    const frame = requestAnimationFrame(() => window.print())
    const onAfter = () => setPrintOrder(null)
    window.addEventListener('afterprint', onAfter)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', onAfter)
    }
  }, [printOrder])

  const ticket = tickets[active] ?? emptyTicket()

  const updateTicket = (patch: Partial<DraftTicket>) => {
    setTickets((current) =>
      current.map((row, index) => (index === activeRef.current ? { ...row, ...patch } : row))
    )
  }

  const closeCash = () => {
    if (savingRef.current) return
    cashRef.current = null
    setCashOpen(false)
  }

  const openCash = () => {
    if (cashRef.current || savingRef.current) return
    const current = tickets[activeRef.current] ?? emptyTicket()
    if (current.lines.length === 0) {
      error_toast(t('orders.emptyInvoice'))
      return
    }
    if (!shiftOpenRef.current) {
      error_toast(t('orders.shiftClosed'))
      return
    }
    for (const line of current.lines) {
      const key = linePileKey(line)
      const pile = positions.find(
        (row) =>
          row.product &&
          row.lot &&
          row.supplier &&
          pileKey(row.product._id, row.lot._id, row.supplier._id, row.lastBuyPrice, row.lastSellPrice) === key
      )
      const others = reservedQty(tickets, key, line.key)
      const available = (pile?.quantity ?? 0) - others
      if (line.qty > available) {
        error_toast(`${t('orders.insufficientStock')} (${Math.max(0, available)})`)
        return
      }
    }
    const total = ticketTotal(current)
    cashRef.current = { index: activeRef.current, ticket: current, total }
    setCashTotal(total)
    setReceivedText('')
    setCashOpen(true)
  }

  const finishCash = async (print: boolean) => {
    const pending = cashRef.current
    if (!pending || savingRef.current) return
    const received = parseMoney(receivedText)
    if (received == null || received < pending.total) return
    savingRef.current = true
    setSaving(true)
    try {
      const order = await orderApi.create({
        clientId: pending.ticket.client?._id ?? null,
        cashReceived: received,
        items: pending.ticket.lines.map((line) => ({
          productId: line.productId,
          lotId: line.lotId,
          supplierId: line.supplierId,
          buyPrice: line.buyPrice,
          catalogPrice: line.catalogPrice,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
      })
      setTickets((rows) => rows.map((row, index) => (index === pending.index ? emptyTicket() : row)))
      cashRef.current = null
      setCashOpen(false)
      sucess_toast(`${t('orders.orderSuccess')} ${order.number}`)
      if (print) setPrintOrder(order)
      try {
        setPositions(await stockApi.positions())
      } catch (err) {
        error_toast(getApiErrorMessage(err))
      }
      requestAnimationFrame(() => actionsRef.current.focusProduct())
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('orders.insufficientStock')))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <h1 className="sr-only">{t('orders.title')}</h1>
      {shiftOpen ? null : (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
          {t('orders.shiftClosed')}
        </p>
      )}
      <SlotBar
        tickets={tickets}
        active={active}
        onSelect={(index) => {
          if (cashRef.current) return
          activeRef.current = index
          setActive(index)
        }}
      />
      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : (
        <TicketForm
          key={active}
          ticket={ticket}
          tickets={tickets}
          products={products}
          clients={clients}
          positions={positions}
          altHeld={altHeld}
          saving={saving}
          shiftOpen={shiftOpen}
          onClient={(client) => updateTicket({ client })}
          onLines={(lines) => updateTicket({ lines })}
          onClientCreated={(client) => setClients((current) => [client, ...current])}
          onValidate={openCash}
          register={(actions) => {
            actionsRef.current = actions
          }}
        />
      )}
      <CashStep
        open={cashOpen}
        total={cashTotal}
        receivedText={receivedText}
        saving={saving}
        onReceivedText={setReceivedText}
        onOpenChange={(open) => {
          if (!open) closeCash()
        }}
        onFinish={(print) => void finishCash(print)}
      />
      <TicketPrint order={printOrder} shopName={shopName} />
    </div>
  )
}
