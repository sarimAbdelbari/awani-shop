import { Caisse } from '@/components/vente/caisse'

export function OrdersPage() {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] min-w-0 flex-col p-4 md:p-6">
      <Caisse />
    </div>
  )
}
