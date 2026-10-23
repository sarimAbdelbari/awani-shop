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
import { Eye, Pencil, Trash2, Plus, Search, X } from 'lucide-react'

import { ActiveFiltersBar } from '@/components/table/active-filters-bar'
import { ColumnTextFilter } from '@/components/table/column-text-filter'
import { ColumnVisibilityMenu } from '@/components/table/column-visibility-menu'
import { DataTablePagination } from '@/components/table/data-table-pagination'
import { SortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  asSupplier,
  receptionLineSearchFields,
  receptionLinesLabel,
  receptionMoney,
  sumReceptionMoney,
} from '@/components/receptions/reception-helpers'
import { formatMoney } from '@/lib/vente-search'
import { usePersistedColumnVisibility } from '@/hooks/use-persisted-column-visibility'
import { usePersistedPagination } from '@/hooks/use-persisted-pagination'
import { useI18n } from '@/i18n'
import { columnTextFilterFn, makeGlobalFilterFn } from '@/lib/table/search'
import type { Reception } from '@/types'

const COLUMN_VISIBILITY_KEY = 'awani_receptionsTable_columnVisibility'
const PAGE_SIZE_KEY = 'awani_receptionsTable_pageSize'

type ReceptionsTableProps = {
  receptions: Reception[]
  loading?: boolean
  isAdmin?: boolean
  onCreate?: () => void
  onView: (reception: Reception) => void
  onEdit: (reception: Reception) => void
  onDelete: (reception: Reception) => void
}

function receptionTotals(reception: Reception) {
  return sumReceptionMoney(
    reception.lines.map((line) => receptionMoney(line.quantity, line.buyPrice, line.sellPrice))
  )
}

function qtyByStatus(reception: Reception, status: 'A' | 'R') {
  return reception.lines
    .filter((l) => l.status === status)
    .reduce((sum, l) => sum + l.quantity, 0)
}

export function ReceptionsTable({
  receptions,
  loading = false,
  isAdmin = false,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: ReceptionsTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = usePersistedPagination(PAGE_SIZE_KEY)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(COLUMN_VISIBILITY_KEY)

  const columns = useMemo<ColumnDef<Reception>[]>(
    () => [
      {
        accessorKey: 'number',
        meta: { label: t('receptions.number') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('receptions.number')} />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold">{row.original.number}</span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'supplier',
        accessorFn: (row) => asSupplier(row.supplier)?.fullName ?? '',
        meta: { label: t('receptions.supplier') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('receptions.supplier')} />
        ),
        cell: ({ row }) => asSupplier(row.original.supplier)?.fullName ?? '-',
        filterFn: columnTextFilterFn,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => new Date(row.createdAt).toLocaleString('fr-DZ'),
        meta: { label: t('common.date') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.date')} />
        ),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('fr-DZ'),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'lines',
        accessorFn: (row) => receptionLinesLabel(row),
        meta: { label: t('receptions.lines') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('receptions.lines')} />
        ),
        cell: ({ row }) => {
          const label = receptionLinesLabel(row.original)
          return (
            <span className="block max-w-xs truncate" title={label}>
              {label || '-'}
            </span>
          )
        },
        filterFn: columnTextFilterFn,
      },
      {
        id: 'acceptedQty',
        accessorFn: (row) => qtyByStatus(row, 'A'),
        meta: { label: t('receptions.acceptedQty') },
        header: t('receptions.acceptedQty'),
        cell: ({ row }) => (
          <Badge variant="secondary">{qtyByStatus(row.original, 'A')}</Badge>
        ),
      },
      {
        id: 'rejectedQty',
        accessorFn: (row) => qtyByStatus(row, 'R'),
        meta: { label: t('receptions.rejectedQty') },
        header: t('receptions.rejectedQty'),
        cell: ({ row }) => {
          const qty = qtyByStatus(row.original, 'R')
          return qty > 0 ? <Badge variant="destructive">{qty}</Badge> : '-'
        },
      },
      {
        id: 'buyTotal',
        accessorFn: (row) => receptionTotals(row).buy,
        meta: { label: t('receptions.buyTotal') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('receptions.buyTotal')} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(receptionTotals(row.original).buy)}</span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'sellTotal',
        accessorFn: (row) => receptionTotals(row).sell,
        meta: { label: t('receptions.sellTotal') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('receptions.sellTotal')} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(receptionTotals(row.original).sell)}</span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'difference',
        accessorFn: (row) => receptionTotals(row).difference,
        meta: { label: t('receptions.difference') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('receptions.difference')} />
        ),
        cell: ({ row }) => {
          const difference = receptionTotals(row.original).difference
          return (
            <span className={`tabular-nums ${difference < 0 ? 'text-destructive' : ''}`}>
              {formatMoney(difference)}
            </span>
          )
        },
        filterFn: columnTextFilterFn,
      },
      {
        id: 'updatedAt',
        accessorFn: (row) => new Date(row.updatedAt).toLocaleString('fr-DZ'),
        meta: { label: t('common.date') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.date')} />
        ),
        cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString('fr-DZ'),
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        cell: ({ row }) => (
          <div className="relative z-10 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title={t('common.view')}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedRowId(row.id)
                onView(row.original)
              }}
            >
              <Eye className="text-primary h-4 w-4" />
            </Button>
            {isAdmin ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title={t('common.edit')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedRowId(row.id)
                    onEdit(row.original)
                  }}
                >
                  <Pencil className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive size-8"
                  title={t('common.delete')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedRowId(row.id)
                    onDelete(row.original)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [t, isAdmin, onView, onEdit, onDelete]
  )

  const globalFilterFn = useMemo(
    () =>
      makeGlobalFilterFn<Reception>((r) => [
        r.number,
        asSupplier(r.supplier)?.fullName,
        receptionLinesLabel(r),
        ...receptionLineSearchFields(r),
      ]),
    []
  )

  const table = useReactTable({
    data: receptions,
    columns,
    getRowId: (row) => row._id,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
      columnFilters,
    },
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
            onChange={(e) => table.setGlobalFilter(e.target.value)}
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
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ActiveFiltersBar
            table={table}
            globalFilter={globalFilter}
            onClearGlobalFilter={() => table.setGlobalFilter('')}
          />
          <ColumnVisibilityMenu table={table} />
          {isAdmin && onCreate ? (
            <Button onClick={onCreate} size="sm" className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              <span>{t('receptions.addReception')}</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto overflow-y-hidden rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wider whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={`${header.id}-filter`} className="px-4 py-2">
                      {header.isPlaceholder ? null : header.column.getCanFilter() ? (
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
                <TableCell colSpan={columns.length} className="text-muted-foreground h-32 text-center text-sm">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selectedRowId === row.id ? 'selected' : undefined}
                  onClick={() => {
                    setSelectedRowId(row.id)
                    onView(row.original)
                  }}
                  className={`cursor-pointer transition-colors ${
                    selectedRowId === row.id
                      ? 'bg-primary/10 hover:bg-primary/15 data-[state=selected]:bg-primary/10'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-32 text-center text-sm">
                  {t('receptions.noReceptions')}
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
