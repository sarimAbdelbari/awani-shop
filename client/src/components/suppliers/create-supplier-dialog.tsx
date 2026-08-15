import { useEffect, useState } from 'react'

import { supplierApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import {
  emptySupplierForm,
  SupplierForm,
  type SupplierFormValues,
} from '@/components/suppliers/supplier-form'
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

export function CreateSupplierDialog({ open, onOpenChange, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<SupplierFormValues>(emptySupplierForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptySupplierForm())
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) {
      error_toast('Le nom est requis')
      return
    }
    setSaving(true)
    try {
      await supplierApi.create(form)
      sucess_toast('Fournisseur créé')
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers.addSupplier')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SupplierForm value={form} onChange={setForm} disabled={saving} />
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
