import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { orderApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { DashboardStats, ExpenseCategory } from '@/types'
import { error_toast } from '@/utils/toastNotification'

const quickLinks = [
  { titleKey: 'nav.venteDirecte', descKey: 'dashboard.linkSale', to: '/dashboard/orders' },
  { titleKey: 'nav.clients', descKey: 'dashboard.linkClients', to: '/dashboard/clients' },
  { titleKey: 'nav.products', descKey: 'dashboard.linkProducts', to: '/dashboard/products' },
  { titleKey: 'nav.stock', descKey: 'dashboard.linkStock', to: '/dashboard/stock' },
] as const

const chartTick = { fontSize: 11, fill: 'var(--muted-foreground)' }

function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function monthStart() {
  const now = new Date()
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

export function DashboardPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(isAdmin)
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(() => isoDate(new Date()))

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    orderApi
      .stats({ from, to })
      .then(setStats)
      .catch((err) => error_toast(getApiErrorMessage(err, t('common.error'))))
      .finally(() => setLoading(false))
  }, [isAdmin, from, to, t])

  const cards = stats
    ? [
        { label: t('dashboard.caToday'), value: formatMoney(stats.caToday) },
        { label: t('dashboard.ticketsToday'), value: String(stats.ticketsToday) },
        { label: t('dashboard.caPeriod'), value: formatMoney(stats.caPeriod) },
        { label: t('dashboard.margePeriod'), value: formatMoney(stats.margePeriod) },
        { label: t('dashboard.resultatPeriod'), value: formatMoney(stats.resultatPeriod) },
      ]
    : []

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <h1 className="sr-only">{t('dashboard.title')}</h1>

      {isAdmin ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="stats-from">{t('report.dateFrom')}</Label>
            <Input
              id="stats-from"
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="stats-to">{t('report.dateTo')}</Label>
            <Input
              id="stats-to"
              type="date"
              value={to}
              min={from}
              max={isoDate(new Date())}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      {isAdmin && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[...Array(5)].map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                    <div className="bg-muted mt-2 h-8 w-20 animate-pulse rounded" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {cards.map((item) => (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">{item.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {stats ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('dashboard.daysChart')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={stats.days}>
                      <XAxis dataKey="date" tick={chartTick} tickFormatter={(value) => String(value).slice(8)} />
                      <YAxis tick={chartTick} width={64} />
                      <Tooltip
                        formatter={(value, name) => [
                          formatMoney(Number(value ?? 0)),
                          name === 'marge' ? t('report.margin') : t('report.ca'),
                        ]}
                        labelFormatter={(label) => String(label)}
                      />
                      <Area
                        type="monotone"
                        dataKey="ca"
                        stroke="var(--chart-1)"
                        fill="var(--chart-1)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="marge"
                        stroke="var(--chart-3)"
                        fill="var(--chart-3)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.topProducts')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topProducts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('dashboard.noSales')}</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 8, right: 8 }}>
                        <XAxis type="number" tick={chartTick} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                        />
                        <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
                        <Bar dataKey="marge" fill="var(--chart-1)" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.fraisChart')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.fraisByCategory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('dashboard.noBills')}</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={stats.fraisByCategory.map((row) => ({
                          ...row,
                          label: t(`expenses.categories.${row.category as ExpenseCategory}`),
                        }))}
                      >
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                        <YAxis tick={chartTick} width={56} />
                        <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
                        <Bar dataKey="amount" fill="var(--chart-3)" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{t('dashboard.lowPiles')}</CardTitle>
                    <CardDescription>{t('dashboard.lowPilesHelp')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/stock">{t('nav.stock')}</Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {stats.lowPiles.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('dashboard.noLowPiles')}</p>
                  ) : (
                    stats.lowPiles.map((pile) => (
                      <div
                        key={`${pile.productCode}-${pile.lotCode}-${pile.supplierName}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {pile.productCode} — {pile.productName}
                          <span className="text-muted-foreground">
                            {' '}
                            · {pile.lotCode} · {pile.supplierName}
                          </span>
                        </span>
                        <span className="font-medium tabular-nums">{pile.quantity}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </>
      )}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{t('dashboard.quickLinks')}</CardTitle>
          <CardDescription>{t('dashboard.quickLinksHelp')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {quickLinks.map((item) => (
            <Button key={item.to} variant="outline" className="h-auto justify-between gap-3 py-3" asChild>
              <Link to={item.to}>
                <span className="flex flex-col items-start gap-0.5 text-left">
                  <span className="font-medium">{t(item.titleKey)}</span>
                  <span className="text-muted-foreground text-xs font-normal">{t(item.descKey)}</span>
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 shrink-0 opacity-60" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
