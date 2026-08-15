import { useState } from 'react'

import { productApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import {
  emptyProductForm,
  isProductFormValid,
  ProductForm,
  type ProductFormValues,
} from '@/components/products/product-form'
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
import type { Category } from '@/types'

type CreateProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSuccess: () => void
}

export function CreateProductDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: CreateProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateProductDialogBody
          onOpenChange={onOpenChange}
          categories={categories}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  )
}

function CreateProductDialogBody({
  onOpenChange,
  categories,
  onSuccess,
}: Omit<CreateProductDialogProps, 'open'>) {
  const { t } = useI18n()
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isProductFormValid(form, { requireCategory: true })) {
      error_toast('Nom et catégorie sont requis')
      return
    }

    setSaving(true)
    try {
      await productApi.create({
        name: form.name.trim(),
        qrCode: form.qrCode.trim(),
        category: form.category,
      })
      sucess_toast('Produit créé')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('products.addProduct')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ProductForm
          value={form}
          onChange={setForm}
          categories={categories}
          disabled={saving}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
