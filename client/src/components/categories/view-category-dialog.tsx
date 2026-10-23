import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import type { Category } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value}</dd>
    </div>
  )
}

export function ViewCategoryDialog({ open, onOpenChange, category }: Props) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.view')}</DialogTitle>
        </DialogHeader>
        {category && (
          <dl>
            <Row label={t('common.code')} value={<span className="font-mono">{category.code}</span>} />
            <Row label={t('common.name')} value={category.name} />
            <Row
              label={t('common.date')}
              value={new Date(category.createdAt).toLocaleString('fr-DZ')}
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
