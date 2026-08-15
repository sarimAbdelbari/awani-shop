import { useEffect, useState } from 'react'

import { clientApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import {
  ClientForm,
  emptyClientForm,
  type ClientFormValues,
} from '@/components/clients/client-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import { error_toast, sucess_toast } from '@/utils/toastNotification'
import type { Client } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess: () => void
}

export function UpdateClientDialog({ open, onOpenChange, client, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<ClientFormValues>(emptyClientForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && client) {
      setForm({ fullName: client.fullName, phone: client.phone || '' })
      setSaving(false)
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return
    if (!form.fullName.trim()) {
      error_toast('Le nom complet est requis')
      return
    }
    setSaving(true)
    try {
      await clientApi.update(client._id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
      })
      sucess_toast('Client mis à jour')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('clients.editClient')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ClientForm value={form} onChange={setForm} disabled={saving} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !client}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
