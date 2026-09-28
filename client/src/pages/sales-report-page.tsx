import { useCallback, useEffect, useMemo, useState } from 'react'

import { expenseApi, orderApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { SalesOrdersTable } from '@/components/vente/sales-orders-table'
import { ViewOrderDialog } from '@/components/vente/view-order-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { Expense, Order } from '@/types'
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

function orderMargin(order: Order) {
  return order.items.reduce((sum, item) => {
    if (typeof item.buyPrice !== 'number') return sum
    return sum + (item.unitPrice - item.buyPrice) * item.qty
  }, 0)
}

export function SalesReportPage() {
  const { t } = useI18n()
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [orders, setOrders] = useState<Order[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOrders, nextExpenses] = await Promise.all([
        orderApi.list({ from, to }),
        expenseApi.list({ from, to }),
      ])
      setOrders(nextOrders)
      setExpenses(nextExpenses)
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }, [from, to, t])

  useEffect(() => {
    void load()
  }, [load])

  const totals = useMemo(() => {
    const ca = orders.reduce((sum, order) => sum + order.total, 0)
    const margin = orders.reduce((sum, order) => sum + orderMargin(order), 0)
    const frais = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      ca: Math.round(ca * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      resultat: Math.round((ca - frais) * 100) / 100,
    }
  }, [orders, expenses])

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
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      <SalesOrdersTable orders={orders} loading={loading} onView={(order) => void onView(order)} />

      <div className="flex flex-wrap justify-end gap-3">
        <Card className="w-full sm:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('report.ca')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(totals.ca)}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('report.caHelp')}</p>
          </CardContent>
        </Card>
        <Card className="w-full sm:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('report.margin')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(totals.margin)}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('report.marginHelp')}</p>
          </CardContent>
        </Card>
        <Card className="w-full sm:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('report.resultat')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(totals.resultat)}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('report.resultatHelp')}</p>
          </CardContent>
        </Card>
      </div>

      <ViewOrderDialog
        open={open}
        onOpenChange={setOpen}
        order={detail}
        loading={detailLoading}
      />
    </div>
  )
}
