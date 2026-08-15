import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'

export type ClientFormValues = {
  fullName: string
  phone: string
}

export const emptyClientForm = (): ClientFormValues => ({
  fullName: '',
  phone: '',
})

type ClientFormProps = {
  value: ClientFormValues
  onChange: (value: ClientFormValues) => void
  disabled?: boolean
}

export function ClientForm({ value, onChange, disabled = false }: ClientFormProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="client-name">{t('clients.fullName')} *</Label>
        <Input
          id="client-name"
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
          placeholder="Ahmed Benali"
          disabled={disabled}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client-phone">{t('common.phone')}</Label>
        <Input
          id="client-phone"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="0555 000 000"
          type="tel"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
