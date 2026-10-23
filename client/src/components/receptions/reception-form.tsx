import { useEffect, useMemo, useRef, useState } from 'react'
import Select, { type SelectInstance } from 'react-select'
import { Plus, Search, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectStyles, type SelectOption } from '@/lib/react-select-styles'
import { matchAllTokensInFields } from '@/lib/table/search'
import { useI18n } from '@/i18n'
import type { Lot, Product, Reception, Supplier } from '@/types'
import { ReceptionMoneySummary } from '@/components/receptions/reception-money-summary'
import {
  draftReceptionMoney,
  emptyLineDraft,
  formatMarginInput,
  latestPricesForProduct,
  parseMarginInput,
  profitMarginPercent,
  sellPriceFromMargin,
  sumReceptionMoney,
  type ReceptionLineDraft,
} from '@/components/receptions/reception-helpers'
import { formatMoney } from '@/lib/vente-search'

function supplierSearchRank(label: string, query: string) {
  const name = label.toLocaleLowerCase()
  const q = query.trim().toLocaleLowerCase()
  if (!q) return 0
  if (name.startsWith(q)) return 0
  if (name.includes(q)) return 1
  return 2
}

function supplierMatchesQuery(label: string, query: string) {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return true
  return label.toLocaleLowerCase().includes(q)
}

type ReceptionFormProps = {
  supplierId: string
  onSupplierChange: (id: string) => void
  note: string
  onNoteChange: (note: string) => void
  lines: ReceptionLineDraft[]
  onLinesChange: (lines: ReceptionLineDraft[]) => void
  suppliers: Supplier[]
  products: Product[]
  lots: Lot[]
  receptions: Reception[]
  disabled?: boolean
  receptionNumber?: string
}

export function ReceptionForm({
  supplierId,
  onSupplierChange,
  note,
  onNoteChange,
  lines,
  onLinesChange,
  suppliers,
  products,
  lots,
  receptions,
  disabled = false,
  receptionNumber,
}: ReceptionFormProps) {
  const { t } = useI18n()
  const [lineQuery, setLineQuery] = useState('')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [marginDraft, setMarginDraft] = useState<Record<string, string>>({})
  const lockedMargin = useRef(new Map<string, number>())
  const productSelectRefs = useRef(new Map<string, SelectInstance<SelectOption, false>>())
  const pendingFocusKey = useRef<string | null>(null)

  const selectedProductIds = new Set(lines.map((l) => l.product).filter(Boolean))
  const selectedLotIds = new Set(lines.map((l) => l.lot).filter(Boolean))

  const supplierOptions: SelectOption[] = useMemo(
    () =>
      suppliers
        .map((s) => ({ value: s._id, label: s.fullName }))
        .sort(
          (a, b) => supplierSearchRank(a.label, supplierQuery) - supplierSearchRank(b.label, supplierQuery)
        ),
    [suppliers, supplierQuery]
  )
  const productOptions: SelectOption[] = products
    .filter((p) => p.isActive || selectedProductIds.has(p._id))
    .map((p) => ({ value: p._id, label: `${p.code} - ${p.name}` }))
  const lotOptions: SelectOption[] = lots
    .filter((l) => l.isActive || selectedLotIds.has(l._id))
    .map((l) => ({ value: l._id, label: `${l.code} - ${l.name}` }))

  const statusOptions: SelectOption[] = [
    { value: 'A', label: t('receptions.accepted') },
    { value: 'R', label: t('receptions.rejected') },
  ]

  const updateLine = (key: string, patch: Partial<ReceptionLineDraft>) => {
    onLinesChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  const lineMatchesQuery = (line: ReceptionLineDraft) =>
    matchAllTokensInFields(
      [
        productOptions.find((option) => option.value === line.product)?.label,
        lotOptions.find((option) => option.value === line.lot)?.label,
        statusOptions.find((option) => option.value === line.status)?.label,
        line.quantity,
        line.buyPrice,
        line.sellPrice,
        formatMarginInput(Number(line.buyPrice), Number(line.sellPrice)),
        line.expiryDate,
        line.observation,
      ],
      lineQuery
    )

  const visibleLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => lineMatchesQuery(line))
  const receptionTotals = sumReceptionMoney(lines.map(draftReceptionMoney))

  const addLine = () => {
    if (disabled) return
    const line = emptyLineDraft(lotOptions[0]?.value ?? '')
    pendingFocusKey.current = line.key
    setLineQuery('')
    onLinesChange([line, ...lines])
  }

  const addLineRef = useRef(addLine)
  addLineRef.current = addLine

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return
      event.preventDefault()
      event.stopPropagation()
      addLineRef.current()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  useEffect(() => {
    const key = pendingFocusKey.current
    if (!key) return
    const select = productSelectRefs.current.get(key)
    if (!select) return
    const frame = requestAnimationFrame(() => {
      if (pendingFocusKey.current !== key) return
      pendingFocusKey.current = null
      for (const [lineKey, instance] of productSelectRefs.current) {
        if (lineKey !== key) instance.onMenuClose()
      }
      select.focus()
      select.openMenu('first')
      select.inputRef?.scrollIntoView({ block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [lines])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {receptionNumber ? (
          <div className="space-y-1.5">
            <Label>{t('receptions.number')}</Label>
            <Input value={receptionNumber} disabled className="font-mono" />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label>{t('receptions.supplier')} *</Label>
          <Select<SelectOption, false>
            options={supplierOptions}
            value={supplierOptions.find((o) => o.value === supplierId) ?? null}
            onChange={(opt) => onSupplierChange(opt?.value ?? '')}
            onInputChange={(value) => setSupplierQuery(value)}
            filterOption={(option, input) => supplierMatchesQuery(option.label, input)}
            placeholder={t('receptions.supplier')}
            isDisabled={disabled}
            isClearable
            isSearchable
            styles={selectStyles}
            noOptionsMessage={() => t('suppliers.noSuppliers')}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="reception-note">{t('receptions.headerNote')}</Label>
          <textarea
            id="reception-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={disabled}
            rows={2}
            className="border-input bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label>{t('receptions.lines')} *</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={lineQuery}
                onChange={(e) => setLineQuery(e.target.value)}
                placeholder={`${t('common.search')} ${t('receptions.lines').toLowerCase()}…`}
                className="h-9 pr-8 pl-9"
                disabled={disabled}
              />
              {lineQuery ? (
                <button
                  type="button"
                  onClick={() => setLineQuery('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                  aria-label={t('table.clearFilter')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              disabled={disabled}
              title={t('receptions.addLineShortcut')}
              onClick={addLine}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('receptions.addLine')}
              <kbd className="bg-muted text-muted-foreground rounded px-1 font-mono text-[10px] font-medium">
                {t('receptions.addLineShortcut')}
              </kbd>
            </Button>
          </div>
        </div>

        {visibleLines.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{t('table.noResults')}</p>
        ) : null}

        {visibleLines.map(({ line, index }) => {
          const totals = draftReceptionMoney(line)
          return (
          <div
            key={line.key}
            className="bg-card flex flex-col gap-3 rounded-xl border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                {t('receptions.lines')} {index + 1}
              </span>
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive size-7"
                  disabled={disabled}
                  title={t('receptions.removeLine')}
                  onClick={() => onLinesChange(lines.filter((l) => l.key !== line.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label>{t('nav.products')}</Label>
                <Select<SelectOption, false>
                  ref={(instance) => {
                    if (instance) productSelectRefs.current.set(line.key, instance)
                    else productSelectRefs.current.delete(line.key)
                  }}
                  options={productOptions}
                  value={productOptions.find((o) => o.value === line.product) ?? null}
                  onChange={(opt) => {
                    const productId = opt?.value ?? ''
                    const prices = latestPricesForProduct(receptions, productId)
                    lockedMargin.current.delete(line.key)
                    setMarginDraft((prev) => {
                      if (prev[line.key] === undefined) return prev
                      const next = { ...prev }
                      delete next[line.key]
                      return next
                    })
                    updateLine(line.key, {
                      product: productId,
                      buyPrice: prices?.buyPrice ?? '',
                      sellPrice: prices?.sellPrice ?? '',
                      allowPriceChange: prices?.allowPriceChange ?? true,
                    })
                  }}
                  placeholder={t('nav.products')}
                  isDisabled={disabled}
                  isSearchable
                  styles={selectStyles}
                  noOptionsMessage={() => t('products.noProducts')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('nav.lots')}</Label>
                <Select<SelectOption, false>
                  options={lotOptions}
                  value={lotOptions.find((o) => o.value === line.lot) ?? null}
                  onChange={(opt) => updateLine(line.key, { lot: opt?.value ?? '' })}
                  placeholder={t('nav.lots')}
                  isDisabled={disabled}
                  isSearchable
                  styles={selectStyles}
                  noOptionsMessage={() => t('lots.noLots')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.quantity')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.status')}</Label>
                <Select<SelectOption, false>
                  options={statusOptions}
                  value={statusOptions.find((o) => o.value === line.status) ?? statusOptions[0]}
                  onChange={(opt) =>
                    updateLine(line.key, { status: (opt?.value as 'A' | 'R') ?? 'A' })
                  }
                  isDisabled={disabled}
                  isSearchable={false}
                  styles={selectStyles}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('receptions.buyPrice')}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.buyPrice}
                  onChange={(e) => {
                    const buyPrice = e.target.value
                    const margin = lockedMargin.current.get(line.key)
                    const sell = margin === undefined ? null : sellPriceFromMargin(Number(buyPrice), margin)
                    updateLine(line.key, {
                      buyPrice,
                      ...(sell !== null ? { sellPrice: String(sell) } : {}),
                    })
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('receptions.margin')}</Label>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    value={
                      marginDraft[line.key] ??
                      formatMarginInput(Number(line.buyPrice), Number(line.sellPrice))
                    }
                    onChange={(e) => {
                      const text = e.target.value
                      setMarginDraft((prev) => ({ ...prev, [line.key]: text }))
                      const margin = parseMarginInput(text)
                      if (margin === null) {
                        lockedMargin.current.delete(line.key)
                        return
                      }
                      lockedMargin.current.set(line.key, margin)
                      const sell = sellPriceFromMargin(Number(line.buyPrice), margin)
                      if (sell === null) return
                      updateLine(line.key, { sellPrice: String(sell) })
                    }}
                    onBlur={() => {
                      const computed = profitMarginPercent(Number(line.buyPrice), Number(line.sellPrice))
                      if (lockedMargin.current.has(line.key)) {
                        if (computed === null) lockedMargin.current.delete(line.key)
                        else lockedMargin.current.set(line.key, computed)
                      }
                      setMarginDraft((prev) => {
                        if (prev[line.key] === undefined) return prev
                        const next = { ...prev }
                        delete next[line.key]
                        return next
                      })
                    }}
                    placeholder="2.5"
                    className="pr-8"
                    disabled={disabled}
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t('receptions.sellPrice')}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.sellPrice}
                  onChange={(e) => {
                    lockedMargin.current.delete(line.key)
                    setMarginDraft((prev) => {
                      if (prev[line.key] === undefined) return prev
                      const next = { ...prev }
                      delete next[line.key]
                      return next
                    })
                    updateLine(line.key, { sellPrice: e.target.value })
                  }}
                  disabled={disabled}
                />
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <Checkbox
                  checked={line.allowPriceChange}
                  onCheckedChange={(checked) =>
                    updateLine(line.key, { allowPriceChange: checked === true })
                  }
                  disabled={disabled}
                />
                {t('receptions.allowPriceChange')}
              </label>
              <div className="space-y-1.5">
                <Label>{t('receptions.expiryDate')}</Label>
                <Input
                  type="date"
                  value={line.expiryDate}
                  onChange={(e) => updateLine(line.key, { expiryDate: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="bg-muted/40 grid gap-2 rounded-lg px-3 py-2 text-sm sm:col-span-2 lg:col-span-3 sm:grid-cols-3">
                <p>
                  <span className="text-muted-foreground">{t('receptions.buyTotal')} </span>
                  <span className="font-medium tabular-nums">{formatMoney(totals.buy)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t('receptions.sellTotal')} </span>
                  <span className="font-medium tabular-nums">{formatMoney(totals.sell)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t('receptions.difference')} </span>
                  <span className={`font-medium tabular-nums ${totals.difference < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(totals.difference)}
                  </span>
                </p>
              </div>
              {line.status === 'R' ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('receptions.observation')} *</Label>
                  <Input
                    value={line.observation}
                    onChange={(e) => updateLine(line.key, { observation: e.target.value })}
                    placeholder={t('receptions.observationRequired')}
                    disabled={disabled}
                  />
                </div>
              ) : null}
            </div>
          </div>
          )
        })}
        <ReceptionMoneySummary totals={receptionTotals} />
      </div>
    </div>
  )
}
