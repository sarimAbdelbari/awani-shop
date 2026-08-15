import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import type { Supplier } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium break-all">{value}</dd>
    </div>
  )
}

export function ViewSupplierDialog({ open, onOpenChange, supplier }: Props) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('common.view')}</DialogTitle>
        </DialogHeader>
        {supplier && (
          <dl>
            <Row label={t('suppliers.fullName')} value={supplier.fullName} />
            <Row label={t('common.phone')} value={supplier.phone || '—'} />
            <Row label={t('suppliers.location')} value={supplier.location || '—'} />
            <Row label={t('suppliers.nif')} value={<span className="font-mono text-xs">{supplier.nif || '—'}</span>} />
            <Row label={t('suppliers.nis')} value={<span className="font-mono text-xs">{supplier.nis || '—'}</span>} />
            <Row label={t('suppliers.rc')} value={<span className="font-mono text-xs">{supplier.rc || '—'}</span>} />
            <Row label={t('common.email')} value={supplier.email || '—'} />
            <Row
              label={t('common.date')}
              value={new Date(supplier.createdAt).toLocaleString('fr-DZ')}
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
