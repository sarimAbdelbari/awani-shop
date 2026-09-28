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
import { Eye, Search, X } from 'lucide-react'

import { ActiveFiltersBar } from '@/components/table/active-filters-bar'
import { ColumnTextFilter } from '@/components/table/column-text-filter'
import { ColumnVisibilityMenu } from '@/components/table/column-visibility-menu'
import { DataTablePagination } from '@/components/table/data-table-pagination'
import { SortableHeader } from '@/components/table/sortable-header'
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
import { usePersistedColumnVisibility } from '@/hooks/use-persisted-column-visibility'
import { usePersistedPagination } from '@/hooks/use-persisted-pagination'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import { columnTextFilterFn, makeGlobalFilterFn } from '@/lib/table/search'
import type { Order } from '@/types'

const COLUMN_VISIBILITY_KEY = 'awani_salesReportTable_columnVisibility'
const PAGE_SIZE_KEY = 'awani_salesReportTable_pageSize'

type SalesOrdersTableProps = {
  orders: Order[]
  loading?: boolean
  onView: (order: Order) => void
}

function clientName(order: Order, fallback: string) {
  if (order.client && typeof order.client === 'object' && 'fullName' in order.client) {
    return order.client.fullName || fallback
  }
  return fallback
}

function totalQty(order: Order) {
  return order.items.reduce((sum, item) => sum + item.qty, 0)
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString('fr-DZ')
}

export function SalesOrdersTable({ orders, loading = false, onView }: SalesOrdersTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = usePersistedPagination(PAGE_SIZE_KEY)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(COLUMN_VISIBILITY_KEY)

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'number',
        meta: { label: t('report.ticket') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('report.ticket')} />
        ),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.number}</span>,
        filterFn: columnTextFilterFn,
      },
      {
        id: 'client',
        accessorFn: (row) => clientName(row, t('orders.comptoir')),
        meta: { label: t('report.client') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('report.client')} />
        ),
        cell: ({ row }) => clientName(row.original, t('orders.comptoir')),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'date',
        accessorFn: (row) => new Date(row.createdAt).getTime(),
        meta: { label: t('common.date') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.date')} />
        ),
        cell: ({ row }) => formatWhen(row.original.createdAt),
        filterFn: (row, _columnId, filterValue) => {
          const query = String(filterValue ?? '').trim().toLowerCase()
          if (!query) return true
          return formatWhen(row.original.createdAt).toLowerCase().includes(query)
        },
      },
      {
        id: 'qty',
        accessorFn: (row) => totalQty(row),
        meta: { label: t('common.quantity') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.quantity')} />
        ),
        cell: ({ row }) => <span className="tabular-nums">{totalQty(row.original)}</span>,
        filterFn: (row, _columnId, filterValue) => {
          const query = String(filterValue ?? '').trim().toLowerCase()
          if (!query) return true
          return String(totalQty(row.original)).includes(query)
        },
      },
      {
        id: 'total',
        accessorFn: (row) => row.total,
        meta: { label: t('common.price') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.price')} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(row.original.total)}</span>
        ),
        filterFn: (row, _columnId, filterValue) => {
          const query = String(filterValue ?? '').trim().toLowerCase()
          if (!query) return true
          const raw = String(row.original.total)
          const pretty = formatMoney(row.original.total).toLowerCase()
          return raw.includes(query) || pretty.includes(query)
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        enableColumnFilter: false,
        meta: { label: t('common.actions') },
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.view')}
            onClick={(event) => {
              event.stopPropagation()
              setSelectedRowId(row.id)
              onView(row.original)
            }}
          >
            <Eye className="text-primary h-4 w-4" />
          </Button>
        ),
      },
    ],
    [onView, t]
  )

  const globalFilterFn = useMemo(
    () =>
      makeGlobalFilterFn<Order>((order) => [
        order.number,
        clientName(order, t('orders.comptoir')),
        formatWhen(order.createdAt),
        totalQty(order),
        order.total,
        formatMoney(order.total),
      ]),
    [t]
  )

  const table = useReactTable({
    data: orders,
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
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ActiveFiltersBar
            table={table}
            globalFilter={globalFilter}
            onClearGlobalFilter={() => table.setGlobalFilter('')}
          />
          <ColumnVisibilityMenu table={table} />
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
                      {header.isPlaceholder || !header.column.getCanFilter() ? (
                        <div className="h-8" />
                      ) : (
                        <ColumnTextFilter column={header.column} />
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
                      ? 'bg-primary/10 hover:bg-primary/15'
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
                  {t('report.noOrders')}
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
