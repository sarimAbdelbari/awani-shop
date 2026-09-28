import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import { ticketTotal, type DraftTicket } from '@/lib/vente-drafts'
import { cn } from '@/lib/utils'

type SlotBarProps = {
  tickets: DraftTicket[]
  active: number
  onSelect: (index: number) => void
}

export function SlotBar({ tickets, active, onSelect }: SlotBarProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist" aria-label={t('orders.invoice')}>
      {tickets.map((ticket, index) => {
        const selected = index === active
        const name = ticket.client?.fullName || t('orders.comptoir')
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={-1}
            onClick={() => onSelect(index)}
            className={cn(
              'flex min-w-0 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left',
              selected ? 'border-ring bg-accent' : 'bg-card hover:bg-muted/60'
            )}
          >
            <span className="text-muted-foreground text-xs font-medium">F{index + 1}</span>
            <span className="w-full truncate text-sm font-medium">{name}</span>
            <span className="text-muted-foreground flex w-full items-center justify-between gap-2 text-xs">
              <span>
                {ticket.lines.length} {t('orders.item')}
              </span>
              <span className="tabular-nums">{formatMoney(ticketTotal(ticket))}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
