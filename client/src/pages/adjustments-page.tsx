import { useEffect, useMemo, useState } from 'react'

import { adjustmentApi, productApi, stockApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { AdjustmentsTable } from '@/components/stock/adjustments-table'
import { SearchList } from '@/components/vente/search-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { pileKey } from '@/lib/vente-drafts'
import { matchWildcard, parseQty, searchRank } from '@/lib/vente-search'
import type { AdjustmentReason, Product, StockAdjustment, StockPosition } from '@/types'
import { error_toast, sucess_toast } from '@/utils/toastNotification'

const REASONS: AdjustmentReason[] = ['casse', 'perte', 'inventaire']

export function AdjustmentsPage() {
  const { t } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [positions, setPositions] = useState<StockPosition[]>([])
  const [rows, setRows] = useState<StockAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [pile, setPile] = useState<StockPosition | null>(null)
  const [reason, setReason] = useState<AdjustmentReason>('casse')
  const [qtyText, setQtyText] = useState('1')
  const [observation, setObservation] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [nextProducts, nextPositions, nextRows] = await Promise.all([
      productApi.list({ active: 'true' }),
      stockApi.positions(),
      adjustmentApi.list(),
    ])
    setProducts(nextProducts)
    setPositions(nextPositions)
    setRows(nextRows)
  }

  useEffect(() => {
    let cancelled = false
    load()
      .catch((err) => {
        if (!cancelled) error_toast(getApiErrorMessage(err, t('common.error')))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const matches = useMemo(
    () =>
      products
        .filter((item) => matchWildcard(query, `${item.code} ${item.name} ${item.qrCode}`))
        .sort((a, b) => searchRank(query, a.code, a.name) - searchRank(query, b.code, b.name))
        .slice(0, 20),
    [products, query]
  )

  const piles = product
    ? positions.filter((row) => row.product?._id === product._id)
    : []

  const submit = async () => {
    if (!pile?.product || !pile.lot || !pile.supplier) {
      error_toast(t('adjustments.needPile'))
      return
    }
    if (!observation.trim()) {
      error_toast(t('adjustments.needObservation'))
      return
    }
    const payload = {
      productId: pile.product._id,
      lotId: pile.lot._id,
      supplierId: pile.supplier._id,
      reason,
      observation: observation.trim(),
    }
    if (reason === 'inventaire') {
      const counted = qtyText.trim() === '' ? null : Number(qtyText)
      if (counted == null || !Number.isInteger(counted) || counted < 0) {
        error_toast(t('adjustments.invalidCount'))
        return
      }
      setSaving(true)
      try {
        await adjustmentApi.create({ ...payload, countedQty: counted })
        sucess_toast(t('adjustments.saved'))
        setObservation('')
        setPile(null)
        setProduct(null)
        setQuery('')
        await load()
      } catch (err) {
        error_toast(getApiErrorMessage(err, t('common.error')))
      } finally {
        setSaving(false)
      }
      return
    }
    const quantity = parseQty(qtyText)
    if (quantity == null) {
      error_toast(t('orders.invalidQty'))
      return
    }
    setSaving(true)
    try {
      await adjustmentApi.create({ ...payload, quantity })
      sucess_toast(t('adjustments.saved'))
      setObservation('')
      setQtyText('1')
      setPile(null)
      setProduct(null)
      setQuery('')
      await load()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
        <div className="relative flex flex-col gap-2">
          <Label htmlFor="adj-product">{t('nav.products')}</Label>
          <Input
            id="adj-product"
            value={query}
            autoComplete="off"
            placeholder={t('orders.searchProduct')}
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlight(0)
              setProduct(null)
              setPile(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setHighlight((current) => {
                  if (matches.length === 0) return 0
                  const delta = event.key === 'ArrowDown' ? 1 : -1
                  return (current + delta + matches.length) % matches.length
                })
              }
              if (event.key === 'Enter' && matches[highlight]) {
                event.preventDefault()
                setProduct(matches[highlight])
                setQuery(`${matches[highlight].code} — ${matches[highlight].name}`)
              }
            }}
          />
          {query.trim() && !product && matches.length > 0 ? (
            <SearchList
              listId="adj-products"
              highlight={highlight}
              options={matches.map((item) => ({
                id: item._id,
                primary: `${item.code} — ${item.name}`,
              }))}
              onPick={(index) => {
                const picked = matches[index]
                if (!picked) return
                setProduct(picked)
                setQuery(`${picked.code} — ${picked.name}`)
              }}
            />
          ) : null}
          {piles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {piles.map((row) => {
                const key = pileKey(row.product?._id ?? '', row.lot?._id ?? '', row.supplier?._id ?? '')
                const selected =
                  pile != null &&
                  pileKey(pile.product?._id ?? '', pile.lot?._id ?? '', pile.supplier?._id ?? '') === key
                const blocked = reason !== 'inventaire' && row.quantity <= 0
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={blocked}
                    onClick={() => setPile(row)}
                    className={
                      selected
                        ? 'bg-accent rounded-lg border px-3 py-2 text-left text-sm'
                        : 'hover:bg-muted rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40'
                    }
                  >
                    {row.lot?.code} — {row.supplier?.fullName} — {t('orders.available')} {row.quantity}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="adj-reason">{t('adjustments.reason')}</Label>
            <select
              id="adj-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as AdjustmentReason)}
              className="border-input bg-input/30 h-9 rounded-4xl border px-3 text-sm"
            >
              {REASONS.map((item) => (
                <option key={item} value={item}>
                  {t(`adjustments.reasons.${item}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="adj-qty">
              {reason === 'inventaire' ? t('adjustments.counted') : t('common.quantity')}
            </Label>
            <Input
              id="adj-qty"
              inputMode="numeric"
              value={qtyText}
              onChange={(event) => setQtyText(event.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="adj-note">{t('adjustments.observation')}</Label>
            <textarea
              id="adj-note"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              className="border-input bg-input/30 min-h-20 rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </div>
      </section>
      <AdjustmentsTable rows={rows} loading={loading} />
    </div>
  )
}
