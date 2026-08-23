import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

type ActiveFiltersBarProps<T> = {
  table: Table<T>
  globalFilter: string
  onClearGlobalFilter: () => void
}

export function ActiveFiltersBar<T>({
  table,
  globalFilter,
  onClearGlobalFilter,
}: ActiveFiltersBarProps<T>) {
  const { t } = useI18n()
  const columnFilters = table.getState().columnFilters

  if (!globalFilter && columnFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {globalFilter ? (
        <Badge variant="secondary" className="gap-1 font-normal">
          {t('table.search')}: {globalFilter}
          <button
            type="button"
            onClick={onClearGlobalFilter}
            className="hover:text-foreground"
            aria-label={t('table.clearFilter')}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ) : null}
      {columnFilters.map((filter) => {
        const col = table.getColumn(filter.id)
        const label =
          (col?.columnDef.meta as { label?: string } | undefined)?.label ?? filter.id
        return (
          <Badge key={filter.id} variant="secondary" className="gap-1 font-normal">
            {label}: {String(filter.value)}
            <button
              type="button"
              onClick={() => col?.setFilterValue(undefined)}
              className="hover:text-foreground"
              aria-label={t('table.clearFilter')}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )
      })}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => {
          onClearGlobalFilter()
          table.resetColumnFilters()
        }}
      >
        {t('table.clearAll')}
      </Button>
    </div>
  )
}
