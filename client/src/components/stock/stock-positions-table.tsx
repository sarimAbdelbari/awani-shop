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
import type { StockPosition } from '@/types'

const COLUMN_VISIBILITY_KEY = 'awani_stockPositionsTable_columnVisibility'
const PAGE_SIZE_KEY = 'awani_stockPositionsTable_pageSize'

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 2,
  }).format(value)
}

type StockPositionsTableProps = {
  positions: StockPosition[]
  loading?: boolean
}

export function StockPositionsTable({
  positions,
  loading = false,
}: StockPositionsTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = usePersistedPagination(PAGE_SIZE_KEY)
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(COLUMN_VISIBILITY_KEY)

  const columns = useMemo<ColumnDef<StockPosition>[]>(
    () => [
      {
        id: 'product',
        accessorFn: (row) =>
          row.product ? `${row.product.code} — ${row.product.name}` : '',
        meta: { label: t('nav.products') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('nav.products')} />
        ),
        cell: ({ row }) =>
          row.original.product
            ? `${row.original.product.code} — ${row.original.product.name}`
            : '—',
        filterFn: columnTextFilterFn,
      },
      {
        id: 'lot',
        accessorFn: (row) =>
          row.lot ? `${row.lot.code} — ${row.lot.name}` : '',
        meta: { label: t('stock.lot') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('stock.lot')} />
        ),
        cell: ({ row }) =>
          row.original.lot ? `${row.original.lot.code} — ${row.original.lot.name}` : '—',
        filterFn: columnTextFilterFn,
      },
      {
        accessorKey: 'quantity',
        meta: { label: t('stock.onHand') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('stock.onHand')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.quantity}</span>
        ),
      },
      {
        id: 'lastBuyPrice',
        accessorFn: (row) => row.lastBuyPrice,
        meta: { label: t('stock.lastBuyPrice') },
        header: t('stock.lastBuyPrice'),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(row.original.lastBuyPrice)}</span>
        ),
      },
      {
        id: 'lastSellPrice',
        accessorFn: (row) => row.lastSellPrice,
        meta: { label: t('stock.lastSellPrice') },
        header: t('stock.lastSellPrice'),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(row.original.lastSellPrice)}</span>
        ),
      },
      {
        id: 'nearestExpiry',
        accessorFn: (row) =>
          row.nearestExpiry
            ? new Date(row.nearestExpiry).toLocaleDateString('fr-DZ')
            : '',
        meta: { label: t('stock.expiry') },
        header: t('stock.expiry'),
        cell: ({ row }) =>
          row.original.nearestExpiry
            ? new Date(row.original.nearestExpiry).toLocaleDateString('fr-DZ')
            : '—',
        filterFn: columnTextFilterFn,
      },
      {
        id: 'lastReception',
        accessorFn: (row) => row.lastReceptionNumber,
        meta: { label: t('stock.lastReception') },
        header: t('stock.lastReception'),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.lastReceptionNumber}</span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'lastSupplier',
        accessorFn: (row) => row.supplier?.fullName ?? '',
        meta: { label: t('stock.lastSupplier') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('stock.lastSupplier')} />
        ),
        cell: ({ row }) => row.original.supplier?.fullName ?? '—',
        filterFn: columnTextFilterFn,
      },
    ],
    [t]
  )

  const globalFilterFn = useMemo(
    () =>
      makeGlobalFilterFn<StockPosition>((p) => [
        p.product?.code,
        p.product?.name,
        p.lot?.code,
        p.lot?.name,
        p.lastReceptionNumber,
        p.supplier?.fullName,
      ]),
    []
  )

  const table = useReactTable({
    data: positions,
    columns,
    getRowId: (row, index) =>
      `${row.product?._id ?? 'p'}-${row.lot?._id ?? 'l'}-${row.supplier?._id ?? 's'}-${index}`,
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
                <TableRow key={row.id} className="hover:bg-muted/40">
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
                  {t('stock.noPositions')}
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
