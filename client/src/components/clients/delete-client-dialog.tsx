import { useState } from 'react'

import { clientApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export function DeleteClientDialog({ open, onOpenChange, client, onSuccess }: Props) {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!client) return
    setDeleting(true)
    try {
      await clientApi.remove(client._id)
      sucess_toast('Client supprimé')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-none min-h-0 overflow-visible sm:max-w-md" showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>{t('common.delete')}</DialogTitle>
          <DialogDescription>
            {client
              ? `${t('common.confirmDelete')} "${client.fullName}"`
              : t('common.confirmDelete')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting || !client}>
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
