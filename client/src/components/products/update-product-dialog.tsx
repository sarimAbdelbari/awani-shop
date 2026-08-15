import { useEffect, useState } from 'react'

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
import type { Category, Product } from '@/types'

type UpdateProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  onSuccess: () => void
}

export function UpdateProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: UpdateProductDialogProps) {
  const { t } = useI18n()
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && product) {
      setForm({
        name: product.name,
        qrCode: product.qrCode || '',
        category: product.category?._id ?? '',
      })
      setSaving(false)
    }
  }, [open, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (!isProductFormValid(form, { requireCategory: false })) {
      error_toast('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      await productApi.update(product._id, {
        name: form.name.trim(),
        qrCode: form.qrCode.trim(),
      })
      sucess_toast('Produit mis à jour')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const categoryLabel = product?.category
    ? `${product.category.code} — ${product.category.name}`
    : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('products.editProduct')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ProductForm
            value={form}
            onChange={setForm}
            categories={categories}
            disabled={saving}
            categoryLocked
            lockedCategoryLabel={categoryLabel}
            productCode={product?.code}
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
            <Button type="submit" disabled={saving || !product}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
