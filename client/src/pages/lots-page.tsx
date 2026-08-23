import { useEffect, useState } from 'react'

import {
  CreateLotDialog,
  UpdateLotDialog,
  DeleteLotDialog,
  ViewLotDialog,
  LotsTable,
} from '@/components/lots'
import { lotApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast } from '@/utils/toastNotification'
import type { Lot } from '@/types'

export function LotsPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Lot | null>(null)
  const [viewing, setViewing] = useState<Lot | null>(null)
  const [deleting, setDeleting] = useState<Lot | null>(null)

  const fetchLots = async () => {
    setLoading(true)
    try {
      setLots(await lotApi.list())
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLots()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <LotsTable
        lots={lots}
        loading={loading}
        isAdmin={isAdmin}
        onCreate={isAdmin ? () => setCreateOpen(true) : undefined}
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <CreateLotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchLots}
      />
      <UpdateLotDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        lot={editing}
        onSuccess={fetchLots}
      />
      <ViewLotDialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        lot={viewing}
      />
      <DeleteLotDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        lot={deleting}
        onSuccess={fetchLots}
      />
    </div>
  )
}
