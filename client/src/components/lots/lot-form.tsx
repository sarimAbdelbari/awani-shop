import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/i18n'

export type LotFormValues = {
  name: string
  code: string
  isActive: boolean
}

export const emptyLotForm = (): LotFormValues => ({
  name: '',
  code: '',
  isActive: true,
})

type LotFormProps = {
  value: LotFormValues
  onChange: (value: LotFormValues) => void
  disabled?: boolean
  codeLocked?: boolean
}

export function LotForm({
  value,
  onChange,
  disabled = false,
  codeLocked = false,
}: LotFormProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="lot-name">{t('common.name')} *</Label>
        <Input
          id="lot-name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Magasin"
          disabled={disabled}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lot-code">{t('lots.code')} *</Label>
        <Input
          id="lot-code"
          value={value.code}
          onChange={(e) =>
            onChange({
              ...value,
              code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8),
            })
          }
          placeholder="MAG"
          className="font-mono uppercase"
          maxLength={8}
          disabled={disabled || codeLocked}
        />
        <p className="text-muted-foreground text-xs">{t('lots.codeHelp')}</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={value.isActive}
          onCheckedChange={(checked) =>
            onChange({ ...value, isActive: checked === true })
          }
          disabled={disabled}
        />
        {t('common.active')}
      </label>
    </div>
  )
}
