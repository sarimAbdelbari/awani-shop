import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

type SearchCell = {
  text: string
  muted?: boolean
  align?: 'start' | 'end'
  hint?: string
}

type SearchOption = {
  id: string
  primary: string
  secondary?: string
  cells?: SearchCell[]
}

type SearchListProps = {
  listId: string
  options: SearchOption[]
  highlight: number
  onPick: (index: number) => void
}

export function SearchList({ listId, options, highlight, onPick }: SearchListProps) {
  const activeRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  if (options.length === 0) return null

  return (
    <ul
      id={listId}
      role="listbox"
      className="bg-popover text-popover-foreground absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border shadow-md"
    >
      {options.map((option, index) => (
        <li
          key={option.id}
          id={`${listId}-opt-${index}`}
          ref={index === highlight ? activeRef : undefined}
          role="option"
          aria-selected={index === highlight}
          className={
            index === highlight
              ? 'bg-accent text-accent-foreground cursor-pointer px-3 py-2'
              : 'hover:bg-muted cursor-pointer px-3 py-2'
          }
          onMouseDown={(event) => {
            event.preventDefault()
            onPick(index)
          }}
        >
          {option.cells ? (
            <span className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_3.25rem_6.5rem] items-baseline gap-2 text-sm">
              {option.cells.map((cell, cellIndex) => (
                <span
                  key={cellIndex}
                  className={cn(
                    'min-w-0 truncate',
                    cell.muted && 'text-muted-foreground/45',
                    cell.align === 'end' && 'text-right tabular-nums'
                  )}
                >
                  {cell.text}
                  {cell.hint ? (
                    <span className="text-muted-foreground block truncate text-xs font-normal">{cell.hint}</span>
                  ) : null}
                </span>
              ))}
            </span>
          ) : (
            <>
              <span className="block text-sm">{option.primary}</span>
              {option.secondary ? (
                <span className="text-muted-foreground block text-xs">{option.secondary}</span>
              ) : null}
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
