import { useEffect, useState } from 'react'

import { lotApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { LotForm, emptyLotForm, type LotFormValues } from '@/components/lots/lot-form'
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
import type { Lot } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lot: Lot | null
  onSuccess: () => void
}

export function UpdateLotDialog({ open, onOpenChange, lot, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<LotFormValues>(emptyLotForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && lot) {
      setForm({ name: lot.name, code: lot.code, isActive: lot.isActive })
      setSaving(false)
    }
  }, [open, lot])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lot) return
    if (!form.name.trim()) {
      error_toast(t('lots.nameRequired'))
      return
    }

    setSaving(true)
    try {
      await lotApi.update(lot._id, { name: form.name.trim(), isActive: form.isActive })
      sucess_toast(t('lots.updated'))
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
          <DialogTitle>{t('lots.editLot')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <LotForm value={form} onChange={setForm} disabled={saving} codeLocked />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !lot}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
