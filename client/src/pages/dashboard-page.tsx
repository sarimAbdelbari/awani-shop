import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { orderApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import type { DashboardStats } from '@/types'

const quickLinks = [
  { titleKey: 'nav.orders', descKey: 'orders.newOrder', to: '/dashboard/orders' },
  { titleKey: 'nav.clients', descKey: 'clients.title', to: '/dashboard/clients' },
  { titleKey: 'nav.products', descKey: 'products.title', to: '/dashboard/products' },
  { titleKey: 'nav.stock', descKey: 'stock.title', to: '/dashboard/stock' },
] as const

export function DashboardPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(isAdmin)

  const today = new Intl.DateTimeFormat('fr-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  useEffect(() => {
    if (!isAdmin) return
    orderApi.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAdmin])

  const statCards = stats
    ? [
        { label: t('dashboard.revenue30d'), value: `${stats.revenue30d.toFixed(0)} DZD` },
        { label: t('dashboard.orders30d'), value: String(stats.orders30d) },
        { label: t('dashboard.totalClients'), value: String(stats.totalClients) },
        {
          label: t('dashboard.lowStock'),
          value: String(stats.lowStockCount),
          alert: stats.lowStockCount > 0,
        },
      ]
    : []

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground text-sm capitalize">{today}</p>
      </div>

      {/* Stat cards — admin only */}
      {isAdmin && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                    <div className="bg-muted mt-2 h-8 w-16 animate-pulse rounded" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((item) => (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="text-3xl font-semibold tabular-nums">
                      {item.value}
                    </CardTitle>
                  </CardHeader>
                  {item.alert && (
                    <CardContent>
                      <Badge variant="destructive" className="text-xs">
                        Attention
                      </Badge>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Revenue chart + Top products */}
          {stats && stats.dailyRevenue.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('dashboard.revenueChart')}</CardTitle>
                  <CardDescription>30 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.dailyRevenue}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(91 20% 62%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(91 20% 62%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 11 }} width={60} />
                      <Tooltip
                        formatter={(v) => [
                          `${Number(v ?? 0).toFixed(0)} DZD`,
                          "Chiffre d'affaires",
                        ]}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(91 20% 62%)"
                        fill="url(#revenueGrad)"
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
                <CardContent className="flex flex-col gap-2">
                  {stats.topProducts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('dashboard.noActivity')}</p>
                  ) : (
                    stats.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{p.name}</span>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {p.qty}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Quick links — visible to all */}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Accès rapide</CardTitle>
          <CardDescription>Aller directement à une section.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {quickLinks.map((item) => (
            <Button
              key={item.to}
              variant="outline"
              className="h-auto justify-between gap-3 py-3"
              asChild
            >
              <Link to={item.to}>
                <span className="flex flex-col items-start gap-0.5 text-left">
                  <span className="font-medium">{t(item.titleKey)}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {t(item.descKey)}
                  </span>
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-4 shrink-0 opacity-60"
                />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
