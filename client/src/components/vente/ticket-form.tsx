import { useEffect, useId, useRef, useState } from 'react'

import { SearchList } from '@/components/vente/search-list'
import { LineRow } from '@/components/vente/line-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clientApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useI18n } from '@/i18n'
import {
  pileKey,
  reservedQty,
  type DraftLine,
  type DraftTicket,
} from '@/lib/vente-drafts'
import {
  fold,
  formatMoney,
  matchWildcard,
  parseMoney,
  parseQty,
  searchRank,
} from '@/lib/vente-search'
import type { Client, Product, StockPosition } from '@/types'
import { error_toast } from '@/utils/toastNotification'

export type CaisseActions = {
  focusClient: () => void
  newClient: () => void
  escape: () => void
  validate: () => void
}

type TicketFormProps = {
  ticket: DraftTicket
  tickets: DraftTicket[]
  products: Product[]
  clients: Client[]
  positions: StockPosition[]
  altHeld: boolean
  saving: boolean
  shiftOpen: boolean
  onClient: (client: Client | null) => void
  onLines: (lines: DraftLine[]) => void
  onClientCreated: (client: Client) => void
  onValidate: () => void
  register: (actions: CaisseActions) => void
}

function roomFor(
  pile: StockPosition,
  tickets: DraftTicket[],
  excludeLineKey?: string
) {
  if (!pile.product || !pile.lot || !pile.supplier) return 0
  const key = pileKey(pile.product._id, pile.lot._id, pile.supplier._id)
  return pile.quantity - reservedQty(tickets, key, excludeLineKey)
}

export function TicketForm({
  ticket,
  tickets,
  products,
  clients,
  positions,
  altHeld,
  saving,
  shiftOpen,
  onClient,
  onLines,
  onClientCreated,
  onValidate,
  register,
}: TicketFormProps) {
  const { t } = useI18n()
  const clientListId = useId()
  const productListId = useId()
  const clientRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const productRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)

  const [clientQuery, setClientQuery] = useState('')
  const [clientDismissed, setClientDismissed] = useState(false)
  const [clientHighlight, setClientHighlight] = useState(0)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [savingClient, setSavingClient] = useState(false)

  const [productQuery, setProductQuery] = useState('')
  const [productDismissed, setProductDismissed] = useState(false)
  const [productHighlight, setProductHighlight] = useState(0)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pileOpen, setPileOpen] = useState(false)
  const [pileHighlight, setPileHighlight] = useState(0)
  const [selectedPile, setSelectedPile] = useState<StockPosition | null>(null)
  const [qtyText, setQtyText] = useState('1')
  const [priceText, setPriceText] = useState('')

  const clientMatches = clients
    .filter((client) =>
      matchWildcard(clientQuery, `${client.fullName} ${client.phone ?? ''}`)
    )
    .sort(
      (a, b) =>
        searchRank(clientQuery, a.fullName, a.phone ?? '') -
        searchRank(clientQuery, b.fullName, b.phone ?? '')
    )
    .slice(0, 30)

  const productMatches = products
    .filter((product) =>
      matchWildcard(productQuery, `${product.code} ${product.name} ${product.qrCode}`)
    )
    .sort(
      (a, b) =>
        searchRank(productQuery, a.code, a.name) - searchRank(productQuery, b.code, b.name)
    )
    .slice(0, 30)

  const showClients = creating
    ? false
    : clientQuery.trim().length > 0 && !clientDismissed && clientMatches.length > 0
  const showProducts =
    productQuery.trim().length > 0 &&
    !productDismissed &&
    !selectedPile &&
    !pileOpen &&
    productMatches.length > 0

  const piles = pendingProduct
    ? positions.filter((pile) => pile.product?._id === pendingProduct._id)
    : []

  const focusProduct = () => productRef.current?.focus()

  const resetComposer = () => {
    setProductQuery('')
    setProductDismissed(false)
    setPendingProduct(null)
    setPileOpen(false)
    setSelectedPile(null)
    setQtyText('1')
    setPriceText('')
    setProductHighlight(0)
  }

  const choosePile = (pile: StockPosition) => {
    if (roomFor(pile, tickets) < 1) {
      error_toast(t('orders.insufficientStock'))
      return
    }
    setSelectedPile(pile)
    setPileOpen(false)
    setQtyText('1')
    setPriceText(String(pile.lastSellPrice ?? 0))
    if (pile.product) {
      setProductQuery(`${pile.product.code} — ${pile.product.name}`)
    }
    requestAnimationFrame(() => qtyRef.current?.focus())
  }

  const selectProduct = (product: Product) => {
    const nextPiles = positions.filter((pile) => pile.product?._id === product._id)
    const sellable = nextPiles.filter((pile) => roomFor(pile, tickets) > 0)
    setPendingProduct(product)
    setProductDismissed(true)
    setProductQuery(`${product.code} — ${product.name}`)
    if (sellable.length === 0) {
      setPileOpen(nextPiles.length > 0)
      setSelectedPile(null)
      error_toast(t('orders.noPiles'))
      return
    }
    if (sellable.length === 1) {
      choosePile(sellable[0])
      return
    }
    setSelectedPile(null)
    setPileOpen(true)
    setPileHighlight(nextPiles.findIndex((pile) => roomFor(pile, tickets) > 0))
  }

  const addLine = () => {
    if (!selectedPile?.product || !selectedPile.lot || !selectedPile.supplier) return
    const qty = parseQty(qtyText)
    const price = parseMoney(priceText)
    if (qty == null) {
      error_toast(t('orders.invalidQty'))
      qtyRef.current?.focus()
      return
    }
    if (price == null) {
      error_toast(t('orders.invalidPrice'))
      return
    }
    const key = pileKey(selectedPile.product._id, selectedPile.lot._id, selectedPile.supplier._id)
    const room = selectedPile.quantity - reservedQty(tickets, key)
    if (qty > room) {
      error_toast(`${t('orders.insufficientStock')} (${Math.max(0, room)})`)
      return
    }
    const existing = ticket.lines.find(
      (line) => pileKey(line.productId, line.lotId, line.supplierId) === key
    )
    if (existing) {
      onLines(
        ticket.lines.map((line) =>
          line.key === existing.key
            ? {
                ...line,
                qty: line.qty + qty,
                unitPrice: price,
                catalogPrice: selectedPile.lastSellPrice,
              }
            : line
        )
      )
    } else {
      const line: DraftLine = {
        key: crypto.randomUUID(),
        productId: selectedPile.product._id,
        lotId: selectedPile.lot._id,
        supplierId: selectedPile.supplier._id,
        productCode: selectedPile.product.code,
        productName: selectedPile.product.name,
        lotCode: selectedPile.lot.code,
        lotName: selectedPile.lot.name,
        supplierName: selectedPile.supplier.fullName,
        catalogPrice: selectedPile.lastSellPrice,
        unitPrice: price,
        qty,
      }
      onLines([...ticket.lines, line])
    }
    resetComposer()
    requestAnimationFrame(focusProduct)
  }

  const saveClient = async () => {
    const fullName = newName.trim()
    if (!fullName) {
      error_toast(t('orders.nameRequired'))
      nameRef.current?.focus()
      return
    }
    setSavingClient(true)
    try {
      const created = await clientApi.create({
        fullName,
        phone: newPhone.trim(),
      })
      onClientCreated(created)
      onClient(created)
      setCreating(false)
      setNewName('')
      setNewPhone('')
      setClientQuery('')
      requestAnimationFrame(focusProduct)
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('orders.nameRequired')))
    } finally {
      setSavingClient(false)
    }
  }

  const escape = () => {
    if (creating) {
      setCreating(false)
      requestAnimationFrame(() => clientRef.current?.focus())
      return
    }
    if (pileOpen) {
      setPileOpen(false)
      setPendingProduct(null)
      setProductQuery('')
      focusProduct()
      return
    }
    if (showProducts) {
      setProductDismissed(true)
      return
    }
    if (showClients) {
      setClientDismissed(true)
      return
    }
    setProductQuery('')
    setSelectedPile(null)
    setPendingProduct(null)
  }

  useEffect(() => {
    register({
      focusClient: () => {
        if (creating) nameRef.current?.focus()
        else clientRef.current?.focus()
      },
      newClient: () => {
        setCreating(true)
        setClientQuery('')
        requestAnimationFrame(() => nameRef.current?.focus())
      },
      escape,
      validate: onValidate,
    })
  })

  const moveIndex = (current: number, delta: number, count: number) => {
    if (count === 0) return 0
    return (current + delta + count) % count
  }

  const highlightedProduct = productMatches[productHighlight]
  const highlightedPiles = highlightedProduct
    ? positions.filter((pile) => pile.product?._id === highlightedProduct._id)
    : []
  const altPile = pileOpen
    ? piles[pileHighlight]
    : showProducts && highlightedPiles.length === 1
      ? highlightedPiles[0]
      : selectedPile

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium" htmlFor="vente-client">
              {t('orders.searchClient')}
            </label>
            {ticket.client ? (
              <span className="text-sm tabular-nums">
                {ticket.client.loyaltyPoints ?? 0} {t('orders.points')}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">{t('orders.comptoir')}</span>
            )}
          </div>
          {creating ? (
            <div className="flex flex-col gap-2">
              <Input
                ref={nameRef}
                tabIndex={1}
                autoComplete="off"
                placeholder={t('orders.clientName')}
                aria-label={t('orders.clientName')}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void saveClient()
                  }
                }}
              />
              <Input
                tabIndex={2}
                autoComplete="off"
                placeholder={t('orders.phone')}
                aria-label={t('orders.phone')}
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void saveClient()
                  }
                }}
              />
              <Button
                type="button"
                tabIndex={3}
                disabled={savingClient}
                onClick={() => void saveClient()}
              >
                {t('orders.saveClient')}
              </Button>
            </div>
          ) : (
            <>
              <Input
                id="vente-client"
                ref={clientRef}
                tabIndex={1}
                autoComplete="off"
                role="combobox"
                aria-expanded={showClients}
                aria-controls={clientListId}
                aria-activedescendant={
                  showClients ? `${clientListId}-opt-${clientHighlight}` : undefined
                }
                placeholder={ticket.client?.fullName || t('orders.searchClient')}
                value={clientQuery}
                onChange={(event) => {
                  setClientQuery(event.target.value)
                  setClientDismissed(false)
                  setClientHighlight(0)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    if (!showClients) return
                    event.preventDefault()
                    setClientHighlight((current) =>
                      moveIndex(
                        current,
                        event.key === 'ArrowDown' ? 1 : -1,
                        clientMatches.length
                      )
                    )
                    return
                  }
                  if (event.key === 'Enter' && showClients) {
                    event.preventDefault()
                    const picked = clientMatches[clientHighlight]
                    if (!picked) return
                    onClient(picked)
                    setClientQuery('')
                    setClientDismissed(true)
                    focusProduct()
                  }
                }}
              />
              {showClients ? (
                <SearchList
                  listId={clientListId}
                  highlight={clientHighlight}
                  options={clientMatches.map((client) => ({
                    id: client._id,
                    primary: client.fullName,
                    secondary: client.phone || undefined,
                  }))}
                  onPick={(index) => {
                    const picked = clientMatches[index]
                    if (!picked) return
                    onClient(picked)
                    setClientQuery('')
                    setClientDismissed(true)
                    focusProduct()
                  }}
                />
              ) : null}
              <div className="flex gap-2">
                <Button type="button" variant="outline" tabIndex={-1} onClick={() => {
                  setCreating(true)
                  requestAnimationFrame(() => nameRef.current?.focus())
                }}>
                  {t('orders.newClient')}
                </Button>
                {ticket.client ? (
                  <Button type="button" variant="ghost" tabIndex={-1} onClick={() => onClient(null)}>
                    {t('orders.comptoir')}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className="relative flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="vente-product">
            {t('orders.searchProduct')}
          </label>
          <Input
            id="vente-product"
            ref={productRef}
            tabIndex={4}
            autoComplete="off"
            role="combobox"
            aria-expanded={showProducts || pileOpen}
            aria-controls={productListId}
            aria-activedescendant={
              showProducts ? `${productListId}-opt-${productHighlight}` : undefined
            }
            placeholder={t('orders.searchProduct')}
            value={productQuery}
            onChange={(event) => {
              setProductQuery(event.target.value)
              setProductDismissed(false)
              setProductHighlight(0)
              setSelectedPile(null)
              setPileOpen(false)
              setPendingProduct(null)
            }}
            onKeyDown={(event) => {
              if (pileOpen) {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  const delta = event.key === 'ArrowDown' ? 1 : -1
                  setPileHighlight((current) => {
                    if (piles.length === 0) return 0
                    let next = current
                    for (let step = 0; step < piles.length; step += 1) {
                      next = moveIndex(next, delta, piles.length)
                      if (roomFor(piles[next], tickets) > 0) return next
                    }
                    return current
                  })
                  return
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  const pile = piles[pileHighlight]
                  if (pile) choosePile(pile)
                  return
                }
              }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (!showProducts) return
                event.preventDefault()
                setProductHighlight((current) =>
                  moveIndex(current, event.key === 'ArrowDown' ? 1 : -1, productMatches.length)
                )
                return
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                const exact = products.find(
                  (product) =>
                    product.qrCode && fold(product.qrCode) === fold(productQuery.trim())
                )
                if (exact) {
                  selectProduct(exact)
                  return
                }
                const picked = productMatches[productHighlight]
                if (picked) selectProduct(picked)
              }
            }}
          />
          {showProducts ? (
            <SearchList
              listId={productListId}
              highlight={productHighlight}
              options={productMatches.map((product) => ({
                id: product._id,
                primary: `${product.code} — ${product.name}`,
                secondary: product.qrCode || undefined,
              }))}
              onPick={(index) => {
                const picked = productMatches[index]
                if (picked) selectProduct(picked)
              }}
            />
          ) : null}
          {altHeld && altPile?.lastBuyPrice != null ? (
            <p className="text-sm tabular-nums">
              {t('orders.buyPrice')} {formatMoney(altPile.lastBuyPrice)}
            </p>
          ) : null}
        </div>
      </div>

      {pileOpen && piles.length > 0 ? (
        <div className="flex flex-col gap-2" role="listbox" aria-label={t('orders.pickPile')}>
          <p className="text-sm font-medium">{t('orders.pickPile')}</p>
          {piles.map((pile, index) => {
            const room = roomFor(pile, tickets)
            const disabled = room <= 0
            return (
              <button
                key={pileKey(
                  pile.product?._id ?? '',
                  pile.lot?._id ?? String(index),
                  pile.supplier?._id ?? ''
                )}
                type="button"
                tabIndex={disabled ? -1 : 5}
                disabled={disabled}
                className={
                  index === pileHighlight
                    ? 'bg-accent rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40'
                    : 'hover:bg-muted rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40'
                }
                onMouseEnter={() => setPileHighlight(index)}
                onClick={() => choosePile(pile)}
              >
                {pile.lot?.code} — {pile.supplier?.fullName} — {t('orders.available')} {Math.max(0, room)} —{' '}
                {formatMoney(pile.lastSellPrice)}
              </button>
            )
          })}
        </div>
      ) : null}

      {selectedPile ? (
        <div className="grid gap-3 md:grid-cols-[8rem_auto_auto_minmax(0,1fr)_auto] md:items-end">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t('orders.qty')}</span>
            <Input
              ref={qtyRef}
              tabIndex={6}
              inputMode="numeric"
              autoComplete="off"
              aria-label={t('orders.qty')}
              value={qtyText}
              onChange={(event) => setQtyText(event.target.value.replace(/\D/g, ''))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addLine()
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            tabIndex={7}
            className="md:mb-0"
            onClick={() => {
              const current = parseQty(qtyText) ?? 1
              setQtyText(String(current + 1))
            }}
          >
            +
          </Button>
          <Button
            type="button"
            variant="outline"
            tabIndex={8}
            onClick={() => {
              const current = parseQty(qtyText) ?? 1
              setQtyText(String(Math.max(1, current - 1)))
            }}
          >
            −
          </Button>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {t('orders.catalogPrice')} {formatMoney(selectedPile.lastSellPrice)}
            </span>
            <Input
              tabIndex={9}
              inputMode="decimal"
              autoComplete="off"
              aria-label={t('orders.realPrice')}
              placeholder={t('orders.realPrice')}
              value={priceText}
              onChange={(event) => setPriceText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addLine()
                  return
                }
                if (event.ctrlKey || event.metaKey || event.altKey) return
                if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  return
                }
                if (/^\d$/.test(event.key)) return
                if (
                  (event.key === ',' || event.key === '.') &&
                  !event.currentTarget.value.includes(',') &&
                  !event.currentTarget.value.includes('.')
                ) {
                  return
                }
                event.preventDefault()
              }}
            />
          </div>
          <Button type="button" tabIndex={10} onClick={addLine}>
            {t('orders.addToInvoice')}
          </Button>
        </div>
      ) : null}

      <div>
        {ticket.lines.map((line, index) => {
          const pile = positions.find(
            (row) =>
              row.product?._id === line.productId &&
              row.lot?._id === line.lotId &&
              row.supplier?._id === line.supplierId
          )
          const maxQty = pile
            ? pile.quantity - reservedQty(tickets, pileKey(line.productId, line.lotId, line.supplierId), line.key)
            : line.qty
          return (
            <LineRow
              key={line.key}
              line={line}
              tabQty={20 + index * 2}
              tabPrice={21 + index * 2}
              altHeld={altHeld}
              buyPrice={pile?.lastBuyPrice ?? null}
              maxQty={Math.max(0, maxQty)}
              onFocus={() => undefined}
              onQty={(qty) => {
                if (qty > maxQty) {
                  error_toast(`${t('orders.insufficientStock')} (${Math.max(0, maxQty)})`)
                  return
                }
                onLines(ticket.lines.map((row) => (row.key === line.key ? { ...row, qty } : row)))
              }}
              onPrice={(unitPrice) => {
                onLines(ticket.lines.map((row) => (row.key === line.key ? { ...row, unitPrice } : row)))
              }}
              onRemove={() => onLines(ticket.lines.filter((row) => row.key !== line.key))}
            />
          )
        })}
      </div>

      <div className="bg-background sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t py-3">
        <p className="text-muted-foreground text-xs">{t('orders.shortcuts')}</p>
        <div className="flex items-center gap-4">
          <p className="text-3xl font-semibold tabular-nums">{formatMoney(ticket.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0))}</p>
          <Button type="button" tabIndex={500} size="lg" disabled={saving || !shiftOpen} onClick={onValidate}>
            {t('orders.encaisser')}
          </Button>
        </div>
      </div>
    </div>
  )
}
