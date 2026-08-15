import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'

export type SupplierFormValues = {
  fullName: string
  phone: string
  location: string
  nif: string
  nis: string
  rc: string
  email: string
}

export const emptySupplierForm = (): SupplierFormValues => ({
  fullName: '',
  phone: '',
  location: '',
  nif: '',
  nis: '',
  rc: '',
  email: '',
})

type SupplierFormProps = {
  value: SupplierFormValues
  onChange: (value: SupplierFormValues) => void
  disabled?: boolean
}

export function SupplierForm({ value, onChange, disabled = false }: SupplierFormProps) {
  const { t } = useI18n()

  const field = (
    key: keyof SupplierFormValues,
    label: string,
    opts?: { placeholder?: string; required?: boolean; autoFocus?: boolean }
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`supplier-${key}`}>
        {label}
        {opts?.required ? ' *' : ''}
      </Label>
      <Input
        id={`supplier-${key}`}
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        placeholder={opts?.placeholder}
        disabled={disabled}
        autoFocus={opts?.autoFocus}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {field('fullName', t('suppliers.fullName'), {
        placeholder: 'Nom du fournisseur',
        required: true,
        autoFocus: true,
      })}
      {field('phone', t('common.phone'), { placeholder: '0555 000 000' })}
      {field('location', t('suppliers.location'), { placeholder: 'Ville / adresse' })}
      {field('nif', t('suppliers.nif'))}
      {field('nis', t('suppliers.nis'))}
      {field('rc', t('suppliers.rc'))}
      {field('email', t('common.email'), { placeholder: 'fournisseur@exemple.com' })}
    </div>
  )
}
