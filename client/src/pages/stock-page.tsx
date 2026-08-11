import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { productApi, stockApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import type { Product, StockMovement } from '@/types'

export function StockPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [movements, setMovements] = useState<StockMovement[]>([])
  const [alerts, setAlerts] = useState<Product[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deliveryForm, setDeliveryForm] = useState({
    productId: '',
    quantity: '',
    note: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mvs, als] = await Promise.all([stockApi.movements(), stockApi.alerts()])
      setMovements(mvs)
      setAlerts(als)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    productApi.list().then(setProducts).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelivery = async () => {
    if (!deliveryForm.productId || !deliveryForm.quantity) {
      toast.error('Produit et quantité requis')
      return
    }
    setSaving(true)
    try {
      await stockApi.delivery({
        productId: deliveryForm.productId,
        quantity: parseInt(deliveryForm.quantity),
        note: deliveryForm.note,
      })
      toast.success('Livraison enregistrée')
      setDeliveryOpen(false)
      setDeliveryForm({ productId: '', quantity: '', note: '' })
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const sourceLabel = (src: StockMovement['source']) => {
    const map = {
      order: t('stock.sources.order'),
      'supplier-delivery': t('stock.sources.supplier-delivery'),
      manual: t('stock.sources.manual'),
    }
    return map[src] ?? src
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('stock.title')}</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => setDeliveryOpen(true)}>
            {t('stock.delivery')}
          </Button>
        )}
      </div>

      {/* Low stock alert banner */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900 dark:bg-orange-950/30">
          <span className="font-semibold text-orange-700 dark:text-orange-400">
            {alerts.length} {t('stock.lowStockWarning')}
          </span>
          <span className="text-orange-600 text-sm dark:text-orange-300">
            — {alerts.map((a) => a.name).join(', ')}
          </span>
        </div>
      )}

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">{t('stock.movements')}</TabsTrigger>
          <TabsTrigger value="alerts">
            {t('stock.alerts')}
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="mt-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          ) : movements.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('stock.noMovements')}</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('common.date')}</th>
                    <th className="px-4 py-3 text-left font-medium">Produit</th>
                    <th className="px-4 py-3 text-center font-medium">{t('stock.type')}</th>
                    <th className="px-4 py-3 text-center font-medium">{t('common.quantity')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('stock.source')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('common.note')}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {new Date(m.date).toLocaleDateString('fr-DZ')}{' '}
                        {new Date(m.date).toLocaleTimeString('fr-DZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium">{m.product?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={m.type === 'in' ? 'secondary' : 'outline'}>
                          {m.type === 'in' ? t('stock.in') : t('stock.out')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold tabular-nums">
                        {m.type === 'out' ? '−' : '+'}
                        {m.quantity}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{sourceLabel(m.source)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('stock.noAlerts')}</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Produit</th>
                    <th className="px-4 py-3 text-center font-medium">Stock actuel</th>
                    <th className="px-4 py-3 text-center font-medium">Seuil</th>
                    <th className="px-4 py-3 text-left font-medium">Fournisseur</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((p) => (
                    <tr key={p._id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.quantity === 0 ? 'destructive' : 'outline'}>
                          {p.quantity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {p.lowStockThreshold}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.supplier?.name ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delivery sheet */}
      <Sheet open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('stock.delivery')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Produit *</Label>
              <Select
                value={deliveryForm.productId}
                onValueChange={(v) => setDeliveryForm((f) => ({ ...f, productId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} (stock: {p.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.quantity')} *</Label>
              <Input
                type="number"
                min={1}
                value={deliveryForm.quantity}
                onChange={(e) => setDeliveryForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="Quantité reçue"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.note')}</Label>
              <Input
                value={deliveryForm.note}
                onChange={(e) => setDeliveryForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Note optionnelle"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleDelivery} disabled={saving}>
                {saving ? t('common.loading') : 'Enregistrer la livraison'}
              </Button>
              <Button variant="outline" onClick={() => setDeliveryOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
