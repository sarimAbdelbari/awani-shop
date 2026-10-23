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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateCategoryDialog({ open, onOpenChange, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<CategoryFormValues>(emptyCategoryForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyCategoryForm())
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      error_toast('Le nom est requis')
      return
    }
    const code = form.code.trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(code)) {
      error_toast('Le code doit contenir exactement 3 lettres')
      return
    }

    setSaving(true)
    try {
      await categoryApi.create({ name: form.name.trim(), code })
      sucess_toast('Catégorie créée')
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
          <DialogTitle>{t('categories.addCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <CategoryForm value={form} onChange={setForm} disabled={saving} />
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
