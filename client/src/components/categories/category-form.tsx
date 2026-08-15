import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'

export type CategoryFormValues = {
  name: string
  code: string
}

export const emptyCategoryForm = (): CategoryFormValues => ({
  name: '',
  code: '',
})

type CategoryFormProps = {
  value: CategoryFormValues
  onChange: (value: CategoryFormValues) => void
  disabled?: boolean
  codeLocked?: boolean
}

export function CategoryForm({
  value,
  onChange,
  disabled = false,
  codeLocked = false,
}: CategoryFormProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="category-name">{t('common.name')} *</Label>
        <Input
          id="category-name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Verre"
          disabled={disabled}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category-code">{t('categories.code')} *</Label>
        <Input
          id="category-code"
          value={value.code}
          onChange={(e) =>
            onChange({
              ...value,
              code: e.target.value.toUpperCase().slice(0, 3),
            })
          }
          placeholder="GLS"
          className="font-mono uppercase"
          maxLength={3}
          disabled={disabled || codeLocked}
        />
        <p className="text-muted-foreground text-xs">{t('categories.codeHelp')}</p>
      </div>
    </div>
  )
}
