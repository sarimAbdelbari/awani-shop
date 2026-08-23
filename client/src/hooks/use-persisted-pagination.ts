import { useEffect, useState } from 'react'
import type { PaginationState, Updater } from '@tanstack/react-table'

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/components/table/data-table-pagination'

function readPageSize(storageKey: string): number {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved == null) return DEFAULT_PAGE_SIZE
    const n = Number(saved)
    if (PAGE_SIZE_OPTIONS.includes(n)) return n
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_PAGE_SIZE
}

export function usePersistedPagination(storageKey: string) {
  const [pagination, setPaginationState] = useState<PaginationState>(() => ({
    pageIndex: 0,
    pageSize: readPageSize(storageKey),
  }))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(pagination.pageSize))
    } catch {
      /* storage unavailable */
    }
  }, [pagination.pageSize, storageKey])

  const setPagination = (updater: Updater<PaginationState>) => {
    setPaginationState((prev) =>
      typeof updater === 'function' ? updater(prev) : updater
    )
  }

  return [pagination, setPagination] as const
}
