import { useEffect, useState } from 'react'

import {
  CreateClientDialog,
  UpdateClientDialog,
  DeleteClientDialog,
  ViewClientDialog,
  ClientsTable,
} from '@/components/clients'
import { clientApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast } from '@/utils/toastNotification'
import type { Client } from '@/types'

export function ClientsPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [viewing, setViewing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const fetchClients = async () => {
    setLoading(true)
    try {
      setClients(await clientApi.list())
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <ClientsTable
        clients={clients}
        loading={loading}
        isAdmin={isAdmin}
        onCreate={() => setCreateOpen(true)}
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchClients}
      />
      <UpdateClientDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        client={editing}
        onSuccess={fetchClients}
      />
      <ViewClientDialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        client={viewing}
      />
      <DeleteClientDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        client={deleting}
        onSuccess={fetchClients}
      />
    </div>
  )
}
