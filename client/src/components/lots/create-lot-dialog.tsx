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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateLotDialog({ open, onOpenChange, onSuccess }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState<LotFormValues>(emptyLotForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyLotForm())
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      error_toast(t('lots.nameRequired'))
      return
    }
    const code = form.code.trim().toUpperCase()
    if (!/^[A-Z0-9]{2,8}$/.test(code)) {
      error_toast(t('lots.codeInvalid'))
      return
    }

    setSaving(true)
    try {
      await lotApi.create({ name: form.name.trim(), code, isActive: form.isActive })
      sucess_toast(t('lots.created'))
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
          <DialogTitle>{t('lots.addLot')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LotForm value={form} onChange={setForm} disabled={saving} />
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
