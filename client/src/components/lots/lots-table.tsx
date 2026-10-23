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
import { usePersistedColumnVisibility } from '@/hooks/use-persisted-column-visibility'
import { usePersistedPagination } from '@/hooks/use-persisted-pagination'
import { useI18n } from '@/i18n'
import { newestFirst } from '@/lib/table/newest-first'
import { columnTextFilterFn, makeGlobalFilterFn } from '@/lib/table/search'
import type { Lot } from '@/types'

const COLUMN_VISIBILITY_KEY = 'awani_lotsTable_columnVisibility'
const PAGE_SIZE_KEY = 'awani_lotsTable_pageSize'

type LotsTableProps = {
  lots: Lot[]
  loading?: boolean
  isAdmin?: boolean
  onCreate?: () => void
  onView: (lot: Lot) => void
  onEdit: (lot: Lot) => void
  onDelete: (lot: Lot) => void
}

export function LotsTable({
  lots,
  loading = false,
  isAdmin = false,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: LotsTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = usePersistedPagination(PAGE_SIZE_KEY)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(COLUMN_VISIBILITY_KEY)

  const orderedLots = useMemo(
    () => newestFirst(lots, (row) => row.createdAt),
    [lots]
  )

  const columns = useMemo<ColumnDef<Lot>[]>(
    () => [
      {
        accessorKey: 'code',
        meta: { label: t('common.code') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.code')} />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold">{row.original.code}</span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        accessorKey: 'name',
        meta: { label: t('common.name') },
        header: ({ column }) => (
          <SortableHeader column={column} title={t('common.name')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
        filterFn: columnTextFilterFn,
      },
      {
        id: 'status',
        accessorFn: (row) => (row.isActive ? t('common.active') : t('common.inactive')),
        meta: { label: t('common.status') },
        header: t('common.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'secondary' : 'outline'}>
            {row.original.isActive ? t('common.active') : t('common.inactive')}
          </Badge>
        ),
        filterFn: columnTextFilterFn,
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
      makeGlobalFilterFn<Lot>((lot) => [
        lot.code,
        lot.name,
        lot.isActive ? t('common.active') : t('common.inactive'),
      ]),
    [t]
  )

  const table = useReactTable({
    data: orderedLots,
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
              <span>{t('lots.addLot')}</span>
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-32 text-center text-sm"
                >
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
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-32 text-center text-sm"
                >
                  {t('table.noResults')}
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
