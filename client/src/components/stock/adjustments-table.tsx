import { Fragment, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { Search, X } from 'lucide-react'

import { ActiveFiltersBar } from '@/components/table/active-filters-bar'
import { ColumnTextFilter } from '@/components/table/column-text-filter'
import { ColumnVisibilityMenu } from '@/components/table/column-visibility-menu'
import { DataTablePagination } from '@/components/table/data-table-pagination'
import { SortableHeader } from '@/components/table/sortable-header'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePersistedColumnVisibility } from '@/hooks/use-persisted-column-visibility'
import { usePersistedPagination } from '@/hooks/use-persisted-pagination'
import { useI18n } from '@/i18n'
import { columnTextFilterFn, makeGlobalFilterFn } from '@/lib/table/search'
import type { StockAdjustment } from '@/types'

const COLUMN_VISIBILITY_KEY = 'awani_adjustmentsTable_columnVisibility'
const PAGE_SIZE_KEY = 'awani_adjustmentsTable_pageSize'

type AdjustmentsTableProps = {
  rows: StockAdjustment[]
  loading?: boolean
}

export function AdjustmentsTable({ rows, loading = false }: AdjustmentsTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = usePersistedPagination(PAGE_SIZE_KEY)
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(COLUMN_VISIBILITY_KEY)

  const columns = useMemo<ColumnDef<StockAdjustment>[]>(
    () => [
      {
        id: 'date',
        accessorFn: (row) => new Date(row.createdAt).getTime(),
        meta: { label: t('common.date') },
        header: ({ column }) => <SortableHeader column={column} title={t('common.date')} />,
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('fr-DZ'),
        filterFn: (row, _id, value) => {
          const query = String(value ?? '').trim().toLowerCase()
          if (!query) return true
          return new Date(row.original.createdAt).toLocaleString('fr-DZ').toLowerCase().includes(query)
        },
      },
      {
        id: 'product',
        accessorFn: (row) => (row.product ? `${row.product.code} ${row.product.name}` : ''),
        meta: { label: t('nav.products') },
        header: ({ column }) => <SortableHeader column={column} title={t('nav.products')} />,
        cell: ({ row }) =>
          row.original.product ? `${row.original.product.code} - ${row.original.product.name}` : '-',
        filterFn: columnTextFilterFn,
      },
      {
        id: 'pile',
        accessorFn: (row) =>
          `${row.lot?.code ?? ''} ${row.supplier?.fullName ?? ''}`,
        meta: { label: t('stock.lot') },
        header: t('stock.lot'),
        cell: ({ row }) =>
          `${row.original.lot?.code ?? '-'} - ${row.original.supplier?.fullName ?? '-'}`,
        filterFn: columnTextFilterFn,
      },
      {
        id: 'reason',
        accessorFn: (row) => t(`adjustments.reasons.${row.reason}`),
        meta: { label: t('adjustments.reason') },
        header: t('adjustments.reason'),
        cell: ({ row }) => t(`adjustments.reasons.${row.original.reason}`),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'qty',
        accessorFn: (row) => `${row.direction === 'out' ? '-' : '+'}${row.quantity}`,
        meta: { label: t('common.quantity') },
        header: t('common.quantity'),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.direction === 'out' ? '−' : '+'}
            {row.original.quantity}
          </span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        accessorKey: 'observation',
        meta: { label: t('adjustments.observation') },
        header: t('adjustments.observation'),
        cell: ({ row }) => <span className="block max-w-xs truncate">{row.original.observation}</span>,
        filterFn: columnTextFilterFn,
      },
    ],
    [t]
  )

  const globalFilterFn = useMemo(
    () =>
      makeGlobalFilterFn<StockAdjustment>((row) => [
        row.product?.code,
        row.product?.name,
        row.lot?.code,
        row.supplier?.fullName,
        row.reason,
        row.observation,
        row.quantity,
      ]),
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row._id,
    state: { sorting, globalFilter, columnVisibility, pagination, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: (value) => {
      setGlobalFilter(String(value ?? ''))
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    globalFilterFn,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={`${t('common.search')}…`}
            value={globalFilter}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-9 pr-8 pl-9"
          />
          {globalFilter ? (
            <button
              type="button"
              onClick={() => table.setGlobalFilter('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
              aria-label={t('table.clearFilter')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <ActiveFiltersBar
            table={table}
            globalFilter={globalFilter}
            onClearGlobalFilter={() => table.setGlobalFilter('')}
          />
          <ColumnVisibilityMenu table={table} />
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-3 text-xs whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={`${header.id}-filter`} className="px-4 py-2">
                      {header.column.getCanFilter() ? (
                        <ColumnTextFilter column={header.column} />
                      ) : (
                        <div className="h-8" />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </Fragment>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                  {t('adjustments.noRows')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
