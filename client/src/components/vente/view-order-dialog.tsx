import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { Lot, Order, OrderItem, Product, Supplier } from '@/types'

type ViewOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  loading?: boolean
}

function asProduct(value: OrderItem['product']): Product | null {
  if (!value || typeof value === 'string') return null
  return value as Product
}

function asLot(value: OrderItem['lot']): Pick<Lot, '_id' | 'code' | 'name'> | null {
  if (!value || typeof value === 'string') return null
  return value
}

function asSupplier(value: OrderItem['supplier']): Pick<Supplier, '_id' | 'fullName'> | null {
  if (!value || typeof value === 'string') return null
  return value
}

export function ViewOrderDialog({ open, onOpenChange, order, loading = false }: ViewOrderDialogProps) {
  const { t } = useI18n()
  const clientLabel =
    order?.client && typeof order.client === 'object' && order.client.fullName
      ? order.client.fullName
      : t('orders.comptoir')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('common.view')} {order?.number ?? ''}
          </DialogTitle>
        </DialogHeader>
        {loading || !order ? (
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t('report.client')}</dt>
                <dd className="font-medium">{clientLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('common.date')}</dt>
                <dd className="font-medium">
                  {new Date(order.createdAt).toLocaleString('fr-DZ')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('common.price')}</dt>
                <dd className="font-medium tabular-nums">{formatMoney(order.total)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('orders.cashReceived')}</dt>
                <dd className="font-medium tabular-nums">
                  {typeof order.cashReceived === 'number' ? formatMoney(order.cashReceived) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('orders.changeDue')}</dt>
                <dd className="font-medium tabular-nums">
                  {typeof order.change === 'number' ? formatMoney(order.change) : '-'}
                </dd>
              </div>
            </dl>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2">{t('nav.products')}</th>
                    <th className="px-3 py-2">{t('stock.lot')}</th>
                    <th className="px-3 py-2">{t('report.supplier')}</th>
                    <th className="px-3 py-2">{t('orders.qty')}</th>
                    <th className="px-3 py-2">{t('orders.buyPrice')}</th>
                    <th className="px-3 py-2">{t('orders.catalogPrice')}</th>
                    <th className="px-3 py-2">{t('orders.realPrice')}</th>
                    <th className="px-3 py-2">{t('orders.lineTotal')}</th>
                    <th className="px-3 py-2">{t('report.margin')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => {
                    const product = asProduct(item.product)
                    const lot = asLot(item.lot)
                    const supplier = asSupplier(item.supplier)
                    const buy = typeof item.buyPrice === 'number' ? item.buyPrice : null
                    const lineMargin = buy == null ? null : (item.unitPrice - buy) * item.qty
                    return (
                      <tr key={`${order._id}-${index}`} className="border-t">
                        <td className="px-3 py-2">
                          {product ? `${product.code} - ${product.name}` : '-'}
                        </td>
                        <td className="px-3 py-2">{lot ? `${lot.code} - ${lot.name}` : '-'}</td>
                        <td className="px-3 py-2">{supplier?.fullName ?? '-'}</td>
                        <td className="px-3 py-2 tabular-nums">{item.qty}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {buy == null ? '-' : formatMoney(buy)}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{formatMoney(item.catalogPrice)}</td>
                        <td className="px-3 py-2 tabular-nums">{formatMoney(item.unitPrice)}</td>
                        <td className="px-3 py-2 tabular-nums">{formatMoney(item.lineTotal)}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {lineMargin == null ? '-' : formatMoney(lineMargin)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
