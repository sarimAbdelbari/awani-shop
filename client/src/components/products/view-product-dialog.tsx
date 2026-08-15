import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import type { Product } from '@/types'

type ViewProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value}</dd>
    </div>
  )
}

export function ViewProductDialog({
  open,
  onOpenChange,
  product,
}: ViewProductDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('common.view')}</DialogTitle>
        </DialogHeader>
        {product && (
          <dl>
            <Row label={t('products.code')} value={<span className="font-mono">{product.code}</span>} />
            <Row label={t('common.name')} value={product.name} />
            <Row
              label={t('products.qrCode')}
              value={
                <span className="font-mono text-xs">{product.qrCode || '—'}</span>
              }
            />
            <Row
              label={t('products.category')}
              value={
                product.category
                  ? `${product.category.code} — ${product.category.name}`
                  : '—'
              }
            />
            <Row
              label={t('common.status')}
              value={
                <Badge variant={product.isActive ? 'secondary' : 'outline'}>
                  {product.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
              }
            />
            <Row
              label={t('common.date')}
              value={new Date(product.createdAt).toLocaleString('fr-DZ')}
            />
          </dl>
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
