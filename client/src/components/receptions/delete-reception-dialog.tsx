import { useState } from 'react'

import { receptionApi } from '@/api'
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
import type { Reception } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reception: Reception | null
  onSuccess: () => void
}

export function DeleteReceptionDialog({ open, onOpenChange, reception, onSuccess }: Props) {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!reception) return
    setDeleting(true)
    try {
      await receptionApi.remove(reception._id)
      sucess_toast(t('receptions.deleted'))
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
      <DialogContent className="sm:max-w-md" showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>{t('common.delete')}</DialogTitle>
          <DialogDescription>
            {reception
              ? `${t('common.confirmDelete')} "${reception.number}"`
              : t('common.confirmDelete')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !reception}
          >
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
