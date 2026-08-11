import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Delete02Icon,
  Add01Icon,
  Menu01Icon,
  PrinterIcon,
  FloppyDiskIcon,
  UserIcon,
  SearchIcon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { clientApi, orderApi, productApi } from '@/api'
import { useI18n } from '@/i18n'
import type { Client, Order, Product } from '@/types'

interface InvoiceItem {
  product: Product
  qty: number
  discount: number
}

function formatDZD(amount: number, currency = 'DZD') {
  return `${amount.toFixed(2)} ${currency}`
}

function calcLine(item: InvoiceItem) {
  return parseFloat((item.product.sellPrice * item.qty * (1 - item.discount / 100)).toFixed(2))
}

export function OrdersPage() {
  const { t } = useI18n()

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientResults, setShowClientResults] = useState(false)

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([])

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)

  const clientInputRef = useRef<HTMLInputElement>(null)

  // Fetch products on search change
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!productSearch.trim()) {
        setProducts([])
        return
      }
      setProductsLoading(true)
      try {
        const data = await productApi.list(productSearch.trim())
        setProducts(data)
      } catch {
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [productSearch])

  // Fetch clients on search change
  useEffect(() => {
    if (!clientSearch.trim()) {
      setClients([])
      return
    }
    const handler = setTimeout(async () => {
      try {
        const data = await clientApi.list(clientSearch.trim())
        setClients(data)
        setShowClientResults(true)
      } catch {
        setClients([])
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [clientSearch])

  const addProduct = useCallback(
    (product: Product) => {
      if (product.quantity === 0) {
        toast.error(`${product.name} — ${t('orders.insufficientStock')}`)
        return
      }
      setItems((prev) => {
        const existing = prev.find((i) => i.product._id === product._id)
        if (existing) {
          if (existing.qty >= product.quantity) {
            toast.error(`${product.name} — ${t('orders.insufficientStock')}`)
            return prev
          }
          return prev.map((i) =>
            i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i
          )
        }
        return [...prev, { product, qty: 1, discount: 0 }]
      })
      setProductSearch('')
      setProducts([])
    },
    [t]
  )

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product._id !== productId))
  }

  const updateQty = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.product._id !== productId) return i
          const newQty = i.qty + delta
          if (newQty <= 0) return null
          if (newQty > i.product.quantity) {
            toast.error(t('orders.insufficientStock'))
            return i
          }
          return { ...i, qty: newQty }
        })
        .filter(Boolean) as InvoiceItem[]
    )
  }

  const updateDiscount = (productId: string, value: string) => {
    const disc = Math.min(100, Math.max(0, parseFloat(value) || 0))
    setItems((prev) =>
      prev.map((i) => (i.product._id === productId ? { ...i, discount: disc } : i))
    )
  }

  const subtotal = parseFloat(
    items.reduce((s, i) => s + i.product.sellPrice * i.qty, 0).toFixed(2)
  )
  const discountTotal = parseFloat(
    (subtotal - items.reduce((s, i) => s + calcLine(i), 0)).toFixed(2)
  )
  const total = parseFloat((subtotal - discountTotal).toFixed(2))

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error(t('orders.emptyInvoice'))
      return
    }
    setSubmitting(true)
    try {
      const order = await orderApi.create({
        clientId: selectedClient?._id,
        items: items.map((i) => ({
          productId: i.product._id,
          qty: i.qty,
          discount: i.discount,
        })),
      })
      setLastOrder(order)
      toast.success(t('orders.orderSuccess'))
      setItems([])
      setSelectedClient(null)
      setClientSearch('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => window.print()

  const resetInvoice = () => {
    setItems([])
    setSelectedClient(null)
    setClientSearch('')
    setLastOrder(null)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Success state */}
      {lastOrder && (
        <div className="border-b bg-green-50 px-6 py-3 dark:bg-green-950/30 print:hidden">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('orders.orderSuccess')} — #{lastOrder._id.slice(-6).toUpperCase()}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" />
                {t('orders.printInvoice')}
              </Button>
              <Button size="sm" onClick={resetInvoice}>
                <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} className="size-4" />
                {t('orders.newInvoice')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: product search + invoice items ── */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
          {/* Product search */}
          <div className="relative">
            <HugeiconsIcon
              icon={SearchIcon}
              strokeWidth={2}
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="pl-9 text-base"
              placeholder={t('orders.searchProduct')}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Product results */}
          {productsLoading && (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          )}
          {products.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <button
                  key={p._id}
                  onClick={() => addProduct(p)}
                  className="hover:bg-accent flex flex-col rounded-lg border p-3 text-left transition-colors"
                  disabled={p.quantity === 0}
                >
                  <span className="font-medium leading-tight">{p.name}</span>
                  {p.qrCode && (
                    <span className="text-muted-foreground mt-0.5 font-mono text-xs">
                      {p.qrCode}
                    </span>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-primary font-semibold">
                      {formatDZD(p.sellPrice)}
                    </span>
                    <Badge
                      variant={p.quantity === 0 ? 'destructive' : p.isLowStock ? 'outline' : 'secondary'}
                    >
                      {p.quantity === 0 ? 'Rupture' : `Stock: ${p.quantity}`}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Invoice items table */}
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              {t('orders.invoice')}
            </h2>
            {items.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
                {t('orders.emptyInvoice')}
              </p>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">{t('orders.item')}</th>
                      <th className="px-3 py-2 text-center font-medium">{t('orders.qty')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('orders.unitPrice')}</th>
                      <th className="w-24 px-3 py-2 text-center font-medium">
                        {t('orders.discount')}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">{t('orders.lineTotal')}</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.product._id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.product.name}</div>
                          {item.product.qrCode && (
                            <div className="text-muted-foreground font-mono text-xs">
                              {item.product.qrCode}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="hover:bg-muted rounded p-0.5"
                              onClick={() => updateQty(item.product._id, -1)}
                            >
                              <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-3.5" />
                            </button>
                            <span className="w-6 text-center font-medium">{item.qty}</span>
                            <button
                              className="hover:bg-muted rounded p-0.5"
                              onClick={() => updateQty(item.product._id, 1)}
                            >
                              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatDZD(item.product.sellPrice)}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.product._id, e.target.value)}
                            className="h-7 w-full text-center text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {formatDZD(calcLine(item))}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(item.product._id)}
                            className="text-muted-foreground hover:text-destructive rounded p-0.5"
                          >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: client + totals ── */}
        <div className="flex w-72 shrink-0 flex-col gap-4 border-l p-4 md:p-6 lg:w-80">
          {/* Client section */}
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
              Client
            </h2>
            {selectedClient ? (
              <div className="bg-muted/50 rounded-lg border p-3">
                <div className="font-medium">{selectedClient.fullName}</div>
                {selectedClient.phone && (
                  <div className="text-muted-foreground text-sm">{selectedClient.phone}</div>
                )}
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge variant="secondary">
                    {selectedClient.loyaltyPoints} pts fidélité
                  </Badge>
                  <button
                    className="text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => {
                      setSelectedClient(null)
                      setClientSearch('')
                    }}
                  >
                    Changer
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Input
                  ref={clientInputRef}
                  placeholder={t('orders.searchClient')}
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onFocus={() => clientSearch && setShowClientResults(true)}
                  onBlur={() => setTimeout(() => setShowClientResults(false), 200)}
                />
                {showClientResults && clients.length > 0 && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-lg border bg-white shadow-lg dark:bg-neutral-900">
                    {clients.map((c) => (
                      <button
                        key={c._id}
                        className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                        onMouseDown={() => {
                          setSelectedClient(c)
                          setClientSearch('')
                          setShowClientResults(false)
                        }}
                      >
                        <div className="font-medium">{c.fullName}</div>
                        {c.phone && (
                          <div className="text-muted-foreground text-xs">{c.phone}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('orders.subtotal')}</span>
              <span className="tabular-nums">{formatDZD(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>{t('orders.discountTotal')}</span>
                <span className="tabular-nums">− {formatDZD(discountTotal)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>{t('orders.grandTotal')}</span>
              <span className="tabular-nums">{formatDZD(total)}</span>
            </div>
          </div>

          <div className="mt-auto">
            <Button
              className="h-12 w-full text-base"
              disabled={items.length === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? t('common.loading') : t('orders.validate')}
            </Button>
          </div>
        </div>
      </div>

      {/* Print-only invoice view */}
      {lastOrder && (
        <div className="hidden print:block">
          <div className="p-8">
            <h1 className="mb-1 text-2xl font-bold">Facture</h1>
            <p className="text-sm text-gray-500">#{lastOrder._id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-gray-500">
              {new Date(lastOrder.createdAt).toLocaleString('fr-DZ')}
            </p>
            {lastOrder.client && (
              <p className="mt-2 text-sm">
                Client : <strong>{(lastOrder.client as Client).fullName}</strong>
              </p>
            )}
            <table className="mt-6 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-t">
                  <th className="py-2 text-left">Article</th>
                  <th className="py-2 text-center">Qté</th>
                  <th className="py-2 text-right">PU</th>
                  <th className="py-2 text-right">Remise</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1">{i.product.name}</td>
                    <td className="py-1 text-center">{i.qty}</td>
                    <td className="py-1 text-right">{formatDZD(i.product.sellPrice)}</td>
                    <td className="py-1 text-right">{i.discount}%</td>
                    <td className="py-1 text-right">{formatDZD(calcLine(i))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-4 text-right font-semibold">
                    Total
                  </td>
                  <td className="pt-4 text-right font-bold">{formatDZD(lastOrder.total)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-8 text-center text-xs text-gray-400">Merci de votre visite !</p>
          </div>
        </div>
      )}
    </div>
  )
}
