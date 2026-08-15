import { useEffect, useState } from 'react'

import { categoryApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import {
  CategoryForm,
  emptyCategoryForm,
  type CategoryFormValues,
} from '@/components/categories/category-form'
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSuccess: () => void
}

export function UpdateCategoryDialog({ open, onOpenChange, category, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<CategoryFormValues>(emptyCategoryForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && category) {
      setForm({ name: category.name, code: category.code })
      setSaving(false)
    }
  }, [open, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return
    if (!form.name.trim()) {
      error_toast('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      await categoryApi.update(category._id, { name: form.name.trim() })
      sucess_toast('Catégorie mise à jour')
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
          <DialogTitle>{t('categories.editCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CategoryForm value={form} onChange={setForm} disabled={saving} codeLocked />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !category}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
