import Select, { type StylesConfig } from 'react-select'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import type { Category } from '@/types'

export type ProductFormValues = {
  name: string
  qrCode: string
  category: string
}

export const emptyProductForm = (): ProductFormValues => ({
  name: '',
  qrCode: '',
  category: '',
})

export function isProductFormValid(
  values: ProductFormValues,
  options: { requireCategory: boolean }
): boolean {
  if (!values.name.trim()) return false
  if (options.requireCategory && !values.category) return false
  return true
}

type CategoryOption = {
  value: string
  label: string
}

const categorySelectStyles: StylesConfig<CategoryOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    borderRadius: '1.5rem',
    borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
    backgroundColor: 'color-mix(in oklab, var(--input) 30%, transparent)',
    boxShadow: state.isFocused ? '0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
    },
    fontSize: '0.875rem',
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    opacity: state.isDisabled ? 0.5 : 1,
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 12px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: 'var(--foreground)',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--foreground)',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--muted-foreground)',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'var(--muted-foreground)',
    padding: '0 10px',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--muted-foreground)',
    padding: '0 4px',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    boxShadow: '0 8px 24px hsl(0 0% 0% / 0.08)',
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? 'var(--primary)'
      : state.isFocused
        ? 'var(--accent)'
        : 'transparent',
    color: state.isSelected ? 'var(--primary-foreground)' : 'var(--popover-foreground)',
    cursor: 'pointer',
    ':active': {
      backgroundColor: state.isSelected ? 'var(--primary)' : 'var(--accent)',
    },
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
  }),
}

type ProductFormProps = {
  value: ProductFormValues
  onChange: (value: ProductFormValues) => void
  categories: Category[]
  disabled?: boolean
  /** When editing, category is shown read-only */
  categoryLocked?: boolean
  lockedCategoryLabel?: string
  productCode?: string
}

export function ProductForm({
  value,
  onChange,
  categories,
  disabled = false,
  categoryLocked = false,
  lockedCategoryLabel,
  productCode,
}: ProductFormProps) {
  const { t } = useI18n()

  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    value: c._id,
    label: `${c.code} - ${c.name}`,
  }))

  const selectedCategory =
    categoryOptions.find((o) => o.value === value.category) ?? null

  return (
    <div className="flex flex-col gap-4">
      {productCode && (
        <div className="space-y-1.5">
          <Label>{t('products.code')}</Label>
          <Input value={productCode} disabled className="font-mono" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="product-name">{t('common.name')} *</Label>
        <Input
          id="product-name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Shop 75 ml"
          disabled={disabled}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-qr">{t('products.qrCode')}</Label>
        <Input
          id="product-qr"
          value={value.qrCode}
          onChange={(e) => onChange({ ...value, qrCode: e.target.value })}
          placeholder="7457778889922"
          className="font-mono"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-category">
          {t('products.category')} {!categoryLocked && '*'}
        </Label>
        {categoryLocked ? (
          <>
            <Input value={lockedCategoryLabel || '-'} disabled />
            <p className="text-muted-foreground text-xs">{t('products.categoryLocked')}</p>
          </>
        ) : (
          <Select<CategoryOption, false>
            inputId="product-category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(option) =>
              onChange({ ...value, category: option?.value ?? '' })
            }
            placeholder="Choisir une catégorie"
            isDisabled={disabled}
            isClearable
            isSearchable
            styles={categorySelectStyles}
            noOptionsMessage={() => 'Aucune catégorie'}
          />
        )}
        {!categoryLocked && (
          <p className="text-muted-foreground text-xs">{t('products.codeAuto')}</p>
        )}
      </div>
    </div>
  )
}
