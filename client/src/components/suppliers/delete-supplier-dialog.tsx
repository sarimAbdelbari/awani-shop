import { useState } from 'react'

import { supplierApi } from '@/api'
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
import type { Supplier } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
  onSuccess: () => void
}

export function DeleteSupplierDialog({ open, onOpenChange, supplier, onSuccess }: Props) {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!supplier) return
    setDeleting(true)
    try {
      await supplierApi.remove(supplier._id)
      sucess_toast('Fournisseur supprimé')
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
            {supplier
              ? `${t('common.confirmDelete')} "${supplier.fullName}"`
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
            disabled={deleting || !supplier}
          >
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
