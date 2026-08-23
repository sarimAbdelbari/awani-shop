import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'

type SortableHeaderProps<T> = {
  column: Column<T, unknown>
  title: string
}

export function SortableHeader<T>({ column, title }: SortableHeaderProps<T>) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className="hover:bg-transparent px-0 font-medium"
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-40" />
      )}
    </Button>
  )
}
