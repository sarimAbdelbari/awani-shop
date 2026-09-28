import { useEffect, useRef } from 'react'

type SearchOption = {
  id: string
  primary: string
  secondary?: string
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
          <span className="block text-sm">{option.primary}</span>
          {option.secondary ? (
            <span className="text-muted-foreground block text-xs">{option.secondary}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
