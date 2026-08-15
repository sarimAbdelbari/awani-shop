import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'

import {
  CreateClientDialog,
  UpdateClientDialog,
  DeleteClientDialog,
  ViewClientDialog,
} from '@/components/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [viewing, setViewing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const fetchClients = async () => {
    setLoading(true)
    try {
      setClients(await clientApi.list(search.trim() || undefined))
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchClients, 300)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('clients.title')}</h1>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          {t('clients.addClient')}
        </Button>
      </div>

      <Input
        placeholder={`${t('common.search')}…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : clients.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('clients.noClients')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">{t('clients.fullName')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.phone')}</th>
                <th className="px-4 py-3 text-center font-medium">{t('clients.loyaltyPoints')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('clients.since')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{c.fullName}</td>
                  <td className="text-muted-foreground px-4 py-3">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {c.loyaltyPoints > 0 ? (
                      <Badge variant="secondary">{c.loyaltyPoints} pts</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">0</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {new Date(c.createdAt).toLocaleDateString('fr-DZ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setViewing(c)}
                        title={t('common.view')}
                      >
                        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setEditing(c)}
                        title={t('common.edit')}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive size-7"
                          onClick={() => setDeleting(c)}
                          title={t('common.delete')}
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
