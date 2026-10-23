import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'
import { formatMoney, parseMoney, parseQty } from '@/lib/vente-search'
import type { DraftLine } from '@/lib/vente-drafts'

type LineRowProps = {
  line: DraftLine
  tabQty: number
  tabPrice: number
  altHeld: boolean
  buyPrice: number | null
  maxQty: number
  onQty: (qty: number) => void
  onPrice: (price: number) => void
  onRemove: () => void
  onFocus: () => void
}

export function LineRow({
  line,
  tabQty,
  tabPrice,
  altHeld,
  buyPrice,
  maxQty,
  onQty,
  onPrice,
  onRemove,
  onFocus,
}: LineRowProps) {
  const { t } = useI18n()
  const [qtyText, setQtyText] = useState(String(line.qty))
  const [priceText, setPriceText] = useState(String(line.unitPrice))

  useEffect(() => {
    setQtyText(String(line.qty))
  }, [line.qty])

  useEffect(() => {
    setPriceText(String(line.unitPrice))
  }, [line.unitPrice])

  const commitQty = () => {
    const qty = parseQty(qtyText)
    if (qty == null) {
      setQtyText(String(line.qty))
      return
    }
    if (qty > maxQty) {
      setQtyText(String(line.qty))
      onQty(qty)
      return
    }
    onQty(qty)
  }

  const commitPrice = () => {
    const price = parseMoney(priceText)
    if (price == null) {
      setPriceText(String(line.unitPrice))
      return
    }
    onPrice(price)
  }

  return (
    <div className="grid grid-cols-1 gap-2 border-b py-3 md:grid-cols-[minmax(0,1fr)_7rem_11rem_8rem] md:items-start">
      <div className="min-w-0" onFocus={onFocus}>
        <p className="truncate text-sm font-medium">
          {line.productCode} - {line.productName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {line.lotCode} - {line.supplierName}
        </p>
        <p className="text-muted-foreground text-xs">
          {t('orders.catalogPrice')} {formatMoney(line.catalogPrice)}
        </p>
        {altHeld && buyPrice != null ? (
          <p className="text-chart-1 text-xs font-medium tabular-nums">
            {t('orders.buyPrice')} {formatMoney(buyPrice)}
          </p>
        ) : null}
      </div>
      <Input
        tabIndex={tabQty}
        inputMode="numeric"
        autoComplete="off"
        aria-label={t('orders.qty')}
        value={qtyText}
        onFocus={onFocus}
        onChange={(event) => setQtyText(event.target.value.replace(/\D/g, ''))}
        onBlur={commitQty}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitQty()
          }
        }}
      />
      <div className="flex flex-col gap-1">
        <Input
          tabIndex={tabPrice}
          inputMode="decimal"
          autoComplete="off"
          aria-label={t('orders.realPrice')}
          value={priceText}
          onFocus={onFocus}
          onChange={(event) => setPriceText(event.target.value)}
          onBlur={commitPrice}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitPrice()
            }
          }}
          className={
            line.allowPriceChange === false
              ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
              : undefined
          }
        />
        {line.allowPriceChange === false ? (
          <p className="text-destructive text-xs">{t('orders.fixedPrice')}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 md:justify-end">
        <span className="text-sm font-medium tabular-nums">
          {formatMoney(line.unitPrice * line.qty)}
        </span>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          tabIndex={-1}
          aria-label={t('orders.removeLine')}
          onClick={onRemove}
          className="text-destructive"
        >
          ×
        </Button>
      </div>
    </div>
  )
}
