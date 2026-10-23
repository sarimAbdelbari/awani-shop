import { useCallback, useEffect, useState } from 'react'

import { orderApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { BenefitsCard, CapitalCard, CompactStat, FraisPie } from '@/components/stats/money-figures'
import { SalesOrdersTable } from '@/components/vente/sales-orders-table'
import { ViewOrderDialog } from '@/components/vente/view-order-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { DashboardStats, Order } from '@/types'
import { error_toast } from '@/utils/toastNotification'

function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function monthStart() {
  const now = new Date()
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

export function SalesReportPage() {
  const { t } = useI18n()
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOrders, nextStats] = await Promise.all([
        orderApi.list({ from, to }),
        orderApi.stats({ from, to }),
      ])
      setOrders(nextOrders)
      setStats(nextStats)
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }, [from, to, t])

  useEffect(() => {
    void load()
  }, [load])

  const onView = async (order: Order) => {
    setOpen(true)
    setDetail(order)
    setDetailLoading(true)
    try {
      setDetail(await orderApi.get(order._id))
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="report-from">{t('report.dateFrom')}</Label>
          <Input
            id="report-from"
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="report-to">{t('report.dateTo')}</Label>
          <Input
            id="report-to"
            type="date"
            value={to}
            min={from}
            max={isoDate(new Date())}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      {stats ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CompactStat label={t('dashboard.caPeriod')} value={formatMoney(stats.caPeriod)} />
            <CompactStat label={t('dashboard.ticketsPeriod')} value={String(stats.ticketsPeriod)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CapitalCard stats={stats} />
            <BenefitsCard stats={stats} />
          </div>
          <FraisPie rows={stats.fraisByCategory} />
        </div>
      ) : null}

      <SalesOrdersTable orders={orders} loading={loading} onView={(order) => void onView(order)} />

      <ViewOrderDialog
        open={open}
        onOpenChange={setOpen}
        order={detail}
        loading={detailLoading}
      />
    </div>
  )
}
