import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { DashboardStats, ExpenseCategory } from '@/types'

const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function inventaireNet(stats: Pick<DashboardStats, 'inventaireOut' | 'inventaireIn'>) {
  return Math.round((stats.inventaireOut - stats.inventaireIn) * 100) / 100
}

function shareLabel(amount: number, total: number) {
  const share = total > 0 ? (amount / total) * 100 : 0
  return `${new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 1 }).format(share)} %`
}

export function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export function CapitalCard({ stats }: { stats: DashboardStats }) {
  const { t } = useI18n()
  const lines = [
    { label: t('adjustments.reasons.casse'), value: stats.casse },
    { label: t('adjustments.reasons.perte'), value: stats.perte },
    { label: t('adjustments.reasons.inventaire'), value: inventaireNet(stats) },
    { label: t('dashboard.capitalAfter'), value: stats.capitalAfter },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{t('dashboard.capital')}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{formatMoney(stats.capital)}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-1.5 text-sm">
          {lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="tabular-nums">{formatMoney(line.value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export function BenefitsCard({ stats }: { stats: DashboardStats }) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{t('dashboard.benefices')}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{formatMoney(stats.margePeriod)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t('dashboard.beneficesAfter')}</span>
          <span className="font-medium tabular-nums">{formatMoney(stats.beneficeAfterFrais)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function FraisPie({
  rows,
  className,
}: {
  rows: { category: string; amount: number }[]
  className?: string
}) {
  const { t } = useI18n()
  const slices = rows.filter((row) => row.amount > 0)
  const total = slices.reduce((sum, row) => sum + row.amount, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('dashboard.fraisChart')}</CardTitle>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('dashboard.noBills')}</p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-52 w-full sm:w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={48}
                    outerRadius={80}
                    stroke="none"
                  >
                    {slices.map((row, index) => (
                      <Cell key={row.category} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
              {slices.map((row, index) => (
                <li key={row.category} className="flex items-start gap-2">
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block">{t(`expenses.categories.${row.category as ExpenseCategory}`)}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatMoney(row.amount)} · {shareLabel(row.amount, total)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
