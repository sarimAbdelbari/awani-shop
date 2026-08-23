import type { Column } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'

type ColumnTextFilterProps<T> = {
  column: Column<T, unknown>
  placeholder?: string
}

export function ColumnTextFilter<T>({
  column,
  placeholder,
}: ColumnTextFilterProps<T>) {
  const { t } = useI18n()
  const value = String(column.getFilterValue() ?? '')

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        placeholder={placeholder ?? `${t('common.search')}…`}
        className="h-8 pr-7 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
      {value ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          onClick={(e) => {
            e.stopPropagation()
            column.setFilterValue(undefined)
          }}
          aria-label={t('table.clearFilter')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
