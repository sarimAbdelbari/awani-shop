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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<ClientFormValues>(emptyClientForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyClientForm())
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) {
      error_toast('Le nom complet est requis')
      return
    }
    setSaving(true)
    try {
      await clientApi.create({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
      })
      sucess_toast('Client créé')
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('clients.addClient')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <ClientForm value={form} onChange={setForm} disabled={saving} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
