import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { ReceptionMoney } from '@/components/receptions/reception-helpers'

type ReceptionMoneySummaryProps = {
  totals: ReceptionMoney
}

export function ReceptionMoneySummary({ totals }: ReceptionMoneySummaryProps) {
  const { t } = useI18n()

  return (
    <dl className="grid gap-3 rounded-xl border p-3 sm:grid-cols-3">
      <div>
        <dt className="text-muted-foreground text-xs">{t('receptions.buyTotal')}</dt>
        <dd className="text-base font-semibold tabular-nums">{formatMoney(totals.buy)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs">{t('receptions.sellTotal')}</dt>
        <dd className="text-base font-semibold tabular-nums">{formatMoney(totals.sell)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs">{t('receptions.difference')}</dt>
        <dd className={`text-base font-semibold tabular-nums ${totals.difference < 0 ? 'text-destructive' : ''}`}>
          {formatMoney(totals.difference)}
        </dd>
      </div>
    </dl>
  )
}
