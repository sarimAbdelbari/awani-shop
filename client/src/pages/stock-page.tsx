import { useEffect, useState } from 'react'

import { stockApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { StockPositionsTable } from '@/components/stock/stock-positions-table'
import { useI18n } from '@/i18n'
import { error_toast } from '@/utils/toastNotification'
import type { StockPosition } from '@/types'

export function StockPage() {
  const { t } = useI18n()
  const [positions, setPositions] = useState<StockPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setPositions(await stockApi.positions())
      } catch (err) {
        error_toast(getApiErrorMessage(err, t('common.error')))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <StockPositionsTable positions={positions} loading={loading} />
    </div>
  )
}
