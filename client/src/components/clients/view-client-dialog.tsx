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
import type { Client } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value}</dd>
    </div>
  )
}

export function ViewClientDialog({ open, onOpenChange, client }: Props) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.view')}</DialogTitle>
        </DialogHeader>
        {client && (
          <dl>
            <Row label={t('clients.fullName')} value={client.fullName} />
            <Row label={t('common.phone')} value={client.phone || '-'} />
            <Row
              label={t('clients.loyaltyPoints')}
              value={
                client.loyaltyPoints > 0 ? (
                  <Badge variant="secondary">{client.loyaltyPoints} pts</Badge>
                ) : (
                  '0'
                )
              }
            />
            <Row
              label={t('clients.since')}
              value={new Date(client.createdAt).toLocaleDateString('fr-DZ')}
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
