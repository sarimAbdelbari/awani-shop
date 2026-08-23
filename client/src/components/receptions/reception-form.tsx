import Select from 'react-select'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectStyles, type SelectOption } from '@/lib/react-select-styles'
import { useI18n } from '@/i18n'
import type { Lot, Product, Supplier } from '@/types'
import {
  emptyLineDraft,
  type ReceptionLineDraft,
} from '@/components/receptions/reception-helpers'

type ReceptionFormProps = {
  supplierId: string
  onSupplierChange: (id: string) => void
  note: string
  onNoteChange: (note: string) => void
  lines: ReceptionLineDraft[]
  onLinesChange: (lines: ReceptionLineDraft[]) => void
  suppliers: Supplier[]
  products: Product[]
  lots: Lot[]
  disabled?: boolean
  receptionNumber?: string
}

export function ReceptionForm({
  supplierId,
  onSupplierChange,
  note,
  onNoteChange,
  lines,
  onLinesChange,
  suppliers,
  products,
  lots,
  disabled = false,
  receptionNumber,
}: ReceptionFormProps) {
  const { t } = useI18n()

  const selectedProductIds = new Set(lines.map((l) => l.product).filter(Boolean))
  const selectedLotIds = new Set(lines.map((l) => l.lot).filter(Boolean))

  const supplierOptions: SelectOption[] = suppliers.map((s) => ({
    value: s._id,
    label: s.fullName,
  }))
  const productOptions: SelectOption[] = products
    .filter((p) => p.isActive || selectedProductIds.has(p._id))
    .map((p) => ({ value: p._id, label: `${p.code} — ${p.name}` }))
  const lotOptions: SelectOption[] = lots
    .filter((l) => l.isActive || selectedLotIds.has(l._id))
    .map((l) => ({ value: l._id, label: `${l.code} — ${l.name}` }))

  const statusOptions: SelectOption[] = [
    { value: 'A', label: t('receptions.accepted') },
    { value: 'R', label: t('receptions.rejected') },
  ]

  const updateLine = (key: string, patch: Partial<ReceptionLineDraft>) => {
    onLinesChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {receptionNumber ? (
          <div className="space-y-1.5">
            <Label>{t('receptions.number')}</Label>
            <Input value={receptionNumber} disabled className="font-mono" />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label>{t('receptions.supplier')} *</Label>
          <Select<SelectOption, false>
            options={supplierOptions}
            value={supplierOptions.find((o) => o.value === supplierId) ?? null}
            onChange={(opt) => onSupplierChange(opt?.value ?? '')}
            placeholder={t('receptions.supplier')}
            isDisabled={disabled}
            isClearable
            isSearchable
            styles={selectStyles}
            noOptionsMessage={() => t('suppliers.noSuppliers')}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="reception-note">{t('receptions.headerNote')}</Label>
          <textarea
            id="reception-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={disabled}
            rows={2}
            className="border-input bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>{t('receptions.lines')} *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={disabled}
            onClick={() => onLinesChange([...lines, emptyLineDraft()])}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('receptions.addLine')}
          </Button>
        </div>

        {lines.map((line, index) => (
          <div
            key={line.key}
            className="bg-card flex flex-col gap-3 rounded-xl border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                {t('receptions.lines')} {index + 1}
              </span>
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive size-7"
                  disabled={disabled}
                  title={t('receptions.removeLine')}
                  onClick={() => onLinesChange(lines.filter((l) => l.key !== line.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label>{t('nav.products')}</Label>
                <Select<SelectOption, false>
                  options={productOptions}
                  value={productOptions.find((o) => o.value === line.product) ?? null}
                  onChange={(opt) => updateLine(line.key, { product: opt?.value ?? '' })}
                  placeholder={t('nav.products')}
                  isDisabled={disabled}
                  isSearchable
                  styles={selectStyles}
                  noOptionsMessage={() => t('products.noProducts')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('nav.lots')}</Label>
                <Select<SelectOption, false>
                  options={lotOptions}
                  value={lotOptions.find((o) => o.value === line.lot) ?? null}
                  onChange={(opt) => updateLine(line.key, { lot: opt?.value ?? '' })}
                  placeholder={t('nav.lots')}
                  isDisabled={disabled}
                  isSearchable
                  styles={selectStyles}
                  noOptionsMessage={() => t('lots.noLots')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.quantity')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.status')}</Label>
                <Select<SelectOption, false>
                  options={statusOptions}
                  value={statusOptions.find((o) => o.value === line.status) ?? statusOptions[0]}
                  onChange={(opt) =>
                    updateLine(line.key, { status: (opt?.value as 'A' | 'R') ?? 'A' })
                  }
                  isDisabled={disabled}
                  isSearchable={false}
                  styles={selectStyles}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('receptions.buyPrice')}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.buyPrice}
                  onChange={(e) => updateLine(line.key, { buyPrice: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('receptions.sellPrice')}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.sellPrice}
                  onChange={(e) => updateLine(line.key, { sellPrice: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('receptions.expiryDate')}</Label>
                <Input
                  type="date"
                  value={line.expiryDate}
                  onChange={(e) => updateLine(line.key, { expiryDate: e.target.value })}
                  disabled={disabled}
                />
              </div>
              {line.status === 'R' ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('receptions.observation')} *</Label>
                  <Input
                    value={line.observation}
                    onChange={(e) => updateLine(line.key, { observation: e.target.value })}
                    placeholder={t('receptions.observationRequired')}
                    disabled={disabled}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
