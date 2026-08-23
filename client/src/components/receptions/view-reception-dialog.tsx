import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { asLot, asProduct, asSupplier } from '@/components/receptions/reception-helpers'
import { useI18n } from '@/i18n'
import type { Reception } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reception: Reception | null
}

export function ViewReceptionDialog({ open, onOpenChange, reception }: Props) {
  const { t } = useI18n()
  const supplier = reception ? asSupplier(reception.supplier) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                <dd className="font-medium">{supplier?.fullName ?? '—'}</dd>
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
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2">{t('nav.products')}</th>
                    <th className="px-3 py-2">{t('nav.lots')}</th>
                    <th className="px-3 py-2">{t('common.quantity')}</th>
                    <th className="px-3 py-2">{t('common.status')}</th>
                    <th className="px-3 py-2">{t('receptions.buyPrice')}</th>
                    <th className="px-3 py-2">{t('receptions.sellPrice')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reception.lines.map((line, i) => {
                    const product = asProduct(line.product)
                    const lot = asLot(line.lot)
                    return (
                      <tr key={line._id || i} className="border-t">
                        <td className="px-3 py-2">
                          {product ? `${product.code} — ${product.name}` : '—'}
                        </td>
                        <td className="px-3 py-2">{lot ? `${lot.code} — ${lot.name}` : '—'}</td>
                        <td className="px-3 py-2">{line.quantity}</td>
                        <td className="px-3 py-2">
                          <Badge variant={line.status === 'A' ? 'secondary' : 'destructive'}>
                            {line.status === 'A' ? t('receptions.accepted') : t('receptions.rejected')}
                          </Badge>
                          {line.status === 'R' && line.observation ? (
                            <p className="text-muted-foreground mt-1 text-xs">{line.observation}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">{line.buyPrice}</td>
                        <td className="px-3 py-2">{line.sellPrice}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
