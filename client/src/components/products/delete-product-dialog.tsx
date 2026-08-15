import { useState } from 'react'

import { productApi } from '@/api'
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
import type { Product } from '@/types'

type DeleteProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: DeleteProductDialogProps) {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!product) return

    setDeleting(true)
    try {
      await productApi.remove(product._id)
      sucess_toast('Produit supprimé')
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
            {product
              ? `${t('common.confirmDelete')} "${product.name}"`
              : t('common.confirmDelete')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !product}
          >
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
