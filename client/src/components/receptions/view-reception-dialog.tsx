import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ReceptionMoneySummary } from '@/components/receptions/reception-money-summary'
import {
  asLot,
  asProduct,
  asSupplier,
  formatMarginLabel,
  receptionMoney,
  sumReceptionMoney,
} from '@/components/receptions/reception-helpers'
import { formatMoney } from '@/lib/vente-search'
import { useI18n } from '@/i18n'
import { matchAllTokensInFields } from '@/lib/table/search'
import type { Reception, ReceptionLine } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reception: Reception | null
  onEdit?: (reception: Reception) => void
}

function lineMatchesSearch(line: ReceptionLine, query: string) {
  const product = asProduct(line.product)
  const lot = asLot(line.lot)
  return matchAllTokensInFields(
    [
      product?.code,
      product?.name,
      lot?.code,
      lot?.name,
      line.observation,
      line.buyPrice,
      line.sellPrice,
      formatMarginLabel(line.buyPrice, line.sellPrice),
    ],
    query
  )
}

export function ViewReceptionDialog({ open, onOpenChange, reception, onEdit }: Props) {
  const { t } = useI18n()
  const [lineQuery, setLineQuery] = useState('')
  const supplier = reception ? asSupplier(reception.supplier) : null
  const visibleLines = reception
    ? reception.lines.filter((line) => lineMatchesSearch(line, lineQuery))
    : []
  const receptionTotals = sumReceptionMoney(
    (reception?.lines ?? []).map((line) => receptionMoney(line.quantity, line.buyPrice, line.sellPrice))
  )

  useEffect(() => {
    setLineQuery('')
  }, [open, reception?._id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('common.view')} {reception?.number}
          </DialogTitle>
        </DialogHeader>
        {reception && (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t('receptions.supplier')}</dt>
                <dd className="font-medium">{supplier?.fullName ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('common.date')}</dt>
                <dd className="font-medium">
                  {new Date(reception.createdAt).toLocaleString('fr-DZ')}
                </dd>
              </div>
              {reception.note ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">{t('receptions.headerNote')}</dt>
                  <dd className="font-medium">{reception.note}</dd>
                </div>
              ) : null}
            </dl>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={lineQuery}
                onChange={(e) => setLineQuery(e.target.value)}
                placeholder={`${t('common.search')} ${t('receptions.lines').toLowerCase()}…`}
                className="h-9 pr-8 pl-9"
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
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2">{t('nav.products')}</th>
                    <th className="px-3 py-2">{t('nav.lots')}</th>
                    <th className="px-3 py-2">{t('common.quantity')}</th>
                    <th className="px-3 py-2">{t('common.status')}</th>
                    <th className="px-3 py-2">{t('receptions.buyPrice')}</th>
                    <th className="px-3 py-2">{t('receptions.margin')}</th>
                    <th className="px-3 py-2">{t('receptions.sellPrice')}</th>
                    <th className="px-3 py-2">{t('receptions.allowPriceChange')}</th>
                    <th className="px-3 py-2">{t('receptions.buyTotal')}</th>
                    <th className="px-3 py-2">{t('receptions.sellTotal')}</th>
                    <th className="px-3 py-2">{t('receptions.difference')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLines.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-muted-foreground px-3 py-6 text-center">
                        {t('table.noResults')}
                      </td>
                    </tr>
                  ) : null}
                  {visibleLines.map((line, i) => {
                    const product = asProduct(line.product)
                    const lot = asLot(line.lot)
                    const totals = receptionMoney(line.quantity, line.buyPrice, line.sellPrice)
                    return (
                      <tr key={line._id || i} className="border-t">
                        <td className="px-3 py-2">
                          {product ? `${product.code} - ${product.name}` : '-'}
                        </td>
                        <td className="px-3 py-2">{lot ? `${lot.code} - ${lot.name}` : '-'}</td>
                        <td className="px-3 py-2">{line.quantity}</td>
                        <td className="px-3 py-2">
                          <Badge variant={line.status === 'A' ? 'secondary' : 'destructive'}>
                            {line.status === 'A' ? t('receptions.accepted') : t('receptions.rejected')}
                          </Badge>
                          {line.status === 'R' && line.observation ? (
                            <p className="text-muted-foreground mt-1 text-xs">{line.observation}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{line.buyPrice}</td>
                        <td className="px-3 py-2 tabular-nums">{formatMarginLabel(line.buyPrice, line.sellPrice)}</td>
                        <td className="px-3 py-2 tabular-nums">{line.sellPrice}</td>
                        <td className="px-3 py-2">
                          {line.allowPriceChange === false ? t('common.no') : t('common.yes')}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{formatMoney(totals.buy)}</td>
                        <td className="px-3 py-2 tabular-nums">{formatMoney(totals.sell)}</td>
                        <td className={`px-3 py-2 tabular-nums ${totals.difference < 0 ? 'text-destructive' : ''}`}>
                          {formatMoney(totals.difference)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <ReceptionMoneySummary totals={receptionTotals} />
          </div>
        )}
        <DialogFooter>
          {onEdit && reception ? (
            <Button
              onClick={() => {
                const current = reception
                onOpenChange(false)
                onEdit(current)
              }}
            >
              {t('common.edit')}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
