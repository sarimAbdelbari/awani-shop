import { useState } from 'react'

import { lotApi } from '@/api'
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
import type { Lot } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lot: Lot | null
  onSuccess: () => void
}

export function DeleteLotDialog({ open, onOpenChange, lot, onSuccess }: Props) {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!lot) return
    setDeleting(true)
    try {
      await lotApi.remove(lot._id)
      sucess_toast(t('lots.deleted'))
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
            {lot ? `${t('common.confirmDelete')} "${lot.name}"` : t('common.confirmDelete')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting || !lot}>
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
