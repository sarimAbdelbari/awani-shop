import { createPortal } from 'react-dom'

import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/vente-search'
import type { Order, OrderItem } from '@/types'

function productLabel(item: OrderItem) {
  if (typeof item.product === 'string') return item.product
  return `${item.product.code} — ${item.product.name}`
}

function pileLabel(item: OrderItem) {
  const lot = typeof item.lot === 'string' ? item.lot : item.lot?.code
  const supplier = typeof item.supplier === 'string' ? item.supplier : item.supplier?.fullName
  return [lot, supplier].filter(Boolean).join(' — ')
}

type TicketPrintProps = {
  order: Order | null
  shopName: string
}

export function TicketPrint({ order, shopName }: TicketPrintProps) {
  const { t } = useI18n()
  if (!order) return null

  return createPortal(
    <article id="vente-ticket" className="vente-ticket">
      <h1>{shopName}</h1>
      <p>{order.number}</p>
      <p>{new Date(order.createdAt).toLocaleString('fr-DZ')}</p>
      <p>
        {order.createdBy?.name} · {order.client?.fullName || t('orders.comptoir')}
      </p>
      <hr />
      <ul>
        {order.items.map((item, index) => (
          <li key={`${productLabel(item)}-${index}`}>
            <p>{productLabel(item)}</p>
            <p>{pileLabel(item)}</p>
            <p>
              {item.qty} × {formatMoney(item.unitPrice)} = {formatMoney(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>
      <hr />
      <p className="ticket-total">
        {t('orders.grandTotal')} {formatMoney(order.total)}
      </p>
    </article>,
    document.body
  )
}
