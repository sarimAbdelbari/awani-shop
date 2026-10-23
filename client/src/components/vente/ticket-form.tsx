import { useEffect, useId, useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Coins01Icon, HashtagIcon, Store01Icon, TextFontIcon } from '@hugeicons/core-free-icons'

import { SearchList } from '@/components/vente/search-list'
import { LineRow } from '@/components/vente/line-row'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { clientApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useI18n } from '@/i18n'
import {
  linePileKey,
  pileKey,
  reservedQty,
  type DraftLine,
  type DraftTicket,
} from '@/lib/vente-drafts'
import {
  comparePileSearch,
  fold,
  formatMoney,
  matchPileQuery,
  matchWildcard,
  parseMoney,
  parseQty,
  searchRank,
  type PileSearchFields,
  type PileSearchTarget,
} from '@/lib/vente-search'
import type { Client, Product, StockPosition } from '@/types'
import { error_toast } from '@/utils/toastNotification'

export type CaisseActions = {
  focusProduct: () => void
  newClient: () => void
  escape: () => void
  validate: () => void
}

const FILTER_KEY = 'awani.vente.searchFilters'

const defaultFilters: PileSearchFields = {
  name: true,
  supplier: true,
  quantity: true,
  price: true,
}

function loadFilters(): PileSearchFields {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY)
    if (!raw) return defaultFilters
    const parsed = JSON.parse(raw) as Partial<PileSearchFields>
    return {
      name: parsed.name !== false,
      supplier: parsed.supplier !== false,
      quantity: parsed.quantity !== false,
      price: parsed.price !== false,
    }
  } catch {
    return defaultFilters
  }
}

function KeyHint({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-current/25 bg-current/10 px-1 py-0.5 font-sans text-[10px] leading-none">
      {children}
    </kbd>
  )
}

function FilterToggle({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: IconSvgElement
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label className="flex cursor-pointer flex-col items-center gap-1">
          <HugeiconsIcon
            icon={icon}
            strokeWidth={2}
            className={checked ? 'size-4' : 'text-muted-foreground size-4'}
          />
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => onCheckedChange(value === true)}
            aria-label={label}
          />
        </label>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
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
  const key = pileKey(
    pile.product._id,
    pile.lot._id,
    pile.supplier._id,
    pile.lastBuyPrice,
    pile.lastSellPrice
  )
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
  const [selectedPile, setSelectedPile] = useState<StockPosition | null>(null)
  const [qtyText, setQtyText] = useState('1')
  const [priceText, setPriceText] = useState('')
  const [filters, setFilters] = useState<PileSearchFields>(loadFilters)

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

  const sellable = positions
    .filter((pile) => pile.product && pile.lot && pile.supplier && pile.quantity > 0)
    .map((pile) => {
      const available = Math.max(0, roomFor(pile, tickets))
      const price = pile.lastSellPrice ?? 0
      const target: PileSearchTarget = {
        code: pile.product?.code ?? '',
        name: pile.product?.name ?? '',
        supplier: pile.supplier?.fullName ?? '',
        quantity: String(available),
        prices: [String(price), price.toFixed(2)],
      }
      return { pile, available, target }
    })
  const pileMatches = sellable
    .filter((row) => matchPileQuery(productQuery, row.target, filters))
    .sort((a, b) => comparePileSearch(productQuery, a.target, b.target, filters))
    .slice(0, 30)
    .map((row) => row.pile)

  const showClients = creating
    ? false
    : clientQuery.trim().length > 0 && !clientDismissed && clientMatches.length > 0
  const showProducts =
    productQuery.trim().length > 0 &&
    !productDismissed &&
    !selectedPile &&
    pileMatches.length > 0

  const focusProduct = () => productRef.current?.focus()

  const toggleFilter = (key: keyof PileSearchFields, checked: boolean) => {
    setFilters((current) => {
      const next = { ...current, [key]: checked }
      sessionStorage.setItem(FILTER_KEY, JSON.stringify(next))
      return next
    })
    setProductHighlight(0)
  }

  const resetComposer = () => {
    setProductQuery('')
    setProductDismissed(false)
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
    setQtyText('1')
    setPriceText(String(pile.lastSellPrice ?? 0))
    if (pile.product) {
      setProductQuery(`${pile.product.code} - ${pile.product.name}`)
    }
    requestAnimationFrame(() => qtyRef.current?.focus())
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
    const key = pileKey(
      selectedPile.product._id,
      selectedPile.lot._id,
      selectedPile.supplier._id,
      selectedPile.lastBuyPrice,
      selectedPile.lastSellPrice
    )
    const room = selectedPile.quantity - reservedQty(tickets, key)
    if (qty > room) {
      error_toast(`${t('orders.insufficientStock')} (${Math.max(0, room)})`)
      return
    }
    const existing = ticket.lines.find((line) => linePileKey(line) === key && line.unitPrice === price)
    if (existing) {
      onLines(
        ticket.lines.map((line) =>
          line.key === existing.key ? { ...line, qty: line.qty + qty } : line
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
        buyPrice: selectedPile.lastBuyPrice,
        catalogPrice: selectedPile.lastSellPrice,
        unitPrice: price,
        qty,
        allowPriceChange: selectedPile.allowPriceChange !== false,
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
  }

  useEffect(() => {
    register({
      focusProduct: () => {
        if (creating) nameRef.current?.focus()
        else productRef.current?.focus()
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

  const altPile = selectedPile ?? (showProducts ? pileMatches[productHighlight] : null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="relative flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-end gap-3">
            <FilterToggle
              icon={TextFontIcon}
              label={t('orders.filterName')}
              checked={filters.name}
              onCheckedChange={(checked) => toggleFilter('name', checked)}
            />
            <FilterToggle
              icon={Store01Icon}
              label={t('orders.filterSupplier')}
              checked={filters.supplier}
              onCheckedChange={(checked) => toggleFilter('supplier', checked)}
            />
            <FilterToggle
              icon={HashtagIcon}
              label={t('orders.filterQuantity')}
              checked={filters.quantity}
              onCheckedChange={(checked) => toggleFilter('quantity', checked)}
            />
            <FilterToggle
              icon={Coins01Icon}
              label={t('orders.filterPrice')}
              checked={filters.price}
              onCheckedChange={(checked) => toggleFilter('price', checked)}
            />
          </div>
          <label className="sr-only" htmlFor="vente-product">
            {t('orders.searchProduct')}
          </label>
          <Input
            id="vente-product"
            ref={productRef}
            tabIndex={1}
            autoComplete="off"
            role="combobox"
            aria-expanded={showProducts}
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
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (!showProducts) return
                event.preventDefault()
                setProductHighlight((current) =>
                  moveIndex(current, event.key === 'ArrowDown' ? 1 : -1, pileMatches.length)
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
                  const qrPiles = positions.filter(
                    (pile) => pile.product?._id === exact._id && roomFor(pile, tickets) > 0
                  )
                  if (qrPiles.length === 1) {
                    choosePile(qrPiles[0])
                    return
                  }
                  if (qrPiles.length === 0) {
                    error_toast(t('orders.noPiles'))
                    return
                  }
                  setProductQuery(`${exact.code} - ${exact.name}`)
                  setProductDismissed(false)
                  setProductHighlight(0)
                  return
                }
                const picked = pileMatches[productHighlight]
                if (picked) choosePile(picked)
              }
            }}
          />
          {showProducts ? (
            <SearchList
              listId={productListId}
              highlight={productHighlight}
              options={pileMatches.map((pile) => {
                const available = Math.max(0, roomFor(pile, tickets))
                return {
                  id: pileKey(
                    pile.product?._id ?? '',
                    pile.lot?._id ?? '',
                    pile.supplier?._id ?? '',
                    pile.lastBuyPrice,
                    pile.lastSellPrice
                  ),
                  primary: `${pile.product?.code} - ${pile.product?.name}`,
                  cells: [
                    {
                      text: `${pile.product?.code} - ${pile.product?.name}`,
                      hint: pile.lot?.code,
                      muted: !filters.name,
                    },
                    { text: pile.supplier?.fullName ?? '', muted: !filters.supplier },
                    { text: String(available), muted: !filters.quantity, align: 'end' },
                    {
                      text: formatMoney(pile.lastSellPrice),
                      muted: !filters.price,
                      align: 'end',
                    },
                  ],
                }
              })}
              onPick={(index) => {
                const picked = pileMatches[index]
                if (picked) choosePile(picked)
              }}
            />
          ) : null}
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <KeyHint>{t('orders.keyEnter')}</KeyHint>
              {t('orders.shortcutPick')}
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyHint>Alt</KeyHint>
              {t('orders.shortcutBuy')}
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyHint>{t('orders.keyEsc')}</KeyHint>
              {t('orders.shortcutClear')}
            </span>
            <span>{t('orders.commaHint')}</span>
          </p>
          {altHeld && altPile?.lastBuyPrice != null ? (
            <p className="text-chart-1 text-sm font-medium tabular-nums">
              {t('orders.buyPrice')} {formatMoney(altPile.lastBuyPrice)}
            </p>
          ) : null}
        </div>

        <div className="relative flex w-full flex-col gap-2 md:w-56">
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
                tabIndex={2}
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
                tabIndex={2}
                className="h-8"
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
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" tabIndex={-1} onClick={() => {
                  setCreating(true)
                  requestAnimationFrame(() => nameRef.current?.focus())
                }}>
                  {t('orders.newClient')}
                  <KeyHint>F8</KeyHint>
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

      </div>

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
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <KeyHint>{t('orders.keyEnter')}</KeyHint>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            tabIndex={7}
            className="md:mb-5"
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
            className="md:mb-5"
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
              className={
                selectedPile.allowPriceChange === false
                  ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                  : undefined
              }
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
            {selectedPile.allowPriceChange === false ? (
              <p className="text-destructive text-xs">{t('orders.fixedPrice')}</p>
            ) : null}
          </div>
          <Button type="button" tabIndex={10} onClick={addLine}>
            {t('orders.addToInvoice')}
            <KeyHint>{t('orders.keyEnter')}</KeyHint>
          </Button>
        </div>
      ) : null}

      <div>
        {ticket.lines.map((line, index) => {
          const pile = positions.find(
            (row) =>
              row.product &&
              row.lot &&
              row.supplier &&
              pileKey(row.product._id, row.lot._id, row.supplier._id, row.lastBuyPrice, row.lastSellPrice) ===
                linePileKey(line)
          )
          const maxQty = pile
            ? pile.quantity - reservedQty(tickets, linePileKey(line), line.key)
            : line.qty
          return (
            <LineRow
              key={line.key}
              line={line}
              tabQty={20 + index * 2}
              tabPrice={21 + index * 2}
              altHeld={altHeld}
              buyPrice={line.buyPrice}
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

      <div className="bg-background sticky bottom-0 flex flex-wrap items-center justify-end gap-4 border-t py-3">
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(ticket.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0))}</p>
        <Button type="button" tabIndex={500} size="lg" disabled={saving || !shiftOpen} onClick={onValidate}>
          {t('orders.encaisser')}
          <KeyHint>F9</KeyHint>
        </Button>
      </div>
    </div>
  )
}
