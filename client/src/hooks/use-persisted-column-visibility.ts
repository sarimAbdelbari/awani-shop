import { useEffect, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'

export function usePersistedColumnVisibility(storageKey: string) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as VisibilityState) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnVisibility))
    } catch {
      /* storage unavailable */
    }
  }, [columnVisibility, storageKey])

  return [columnVisibility, setColumnVisibility] as const
}
