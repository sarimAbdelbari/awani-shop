import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { formatMoney, parseMoney } from '@/lib/vente-search'

type CashStepProps = {
  open: boolean
  total: number
  receivedText: string
  saving: boolean
  onReceivedText: (value: string) => void
  onOpenChange: (open: boolean) => void
  onFinish: (print: boolean) => void
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function CashStep({
  open,
  total,
  receivedText,
  saving,
  onReceivedText,
  onOpenChange,
  onFinish,
}: CashStepProps) {
  const { t } = useI18n()
  const received = parseMoney(receivedText)
  const ready = received != null && received >= total
  const change = ready && received != null ? roundMoney(received - total) : null
  const missing = ready ? null : roundMoney(total - (received ?? 0))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-auto max-h-none min-h-0 overflow-visible sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          document.getElementById('cash-received')?.focus()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('orders.encaisser')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-muted-foreground text-sm">{t('orders.grandTotal')}</p>
            <p className="text-3xl font-semibold tabular-nums">{formatMoney(total)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cash-received">{t('orders.cashReceived')}</Label>
            <Input
              id="cash-received"
              inputMode="decimal"
              autoComplete="off"
              value={receivedText}
              onChange={(event) => onReceivedText(event.target.value.replace(/[^\d.,\s]/g, ''))}
            />
          </div>
          {change != null ? (
            <div>
              <p className="text-muted-foreground text-sm">{t('orders.changeDue')}</p>
              <p className="text-3xl font-semibold tabular-nums">{formatMoney(change)}</p>
            </div>
          ) : (
            <p className="text-destructive text-sm font-medium">
              {t('orders.shortfall')} {formatMoney(missing ?? total)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={!ready || saving} onClick={() => onFinish(false)}>
            {t('orders.finish')}
          </Button>
          <Button type="button" disabled={!ready || saving} onClick={() => onFinish(true)}>
            {t('orders.printInvoice')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
