import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { categoryApi, productApi, supplierApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import type { Category, Product, Supplier } from '@/types'

const EMPTY_FORM = {
  name: '',
  qrCode: '',
  buyPrice: '',
  sellPrice: '',
  quantity: '',
  lowStockThreshold: '5',
  category: '',
  supplier: '',
}

export function ProductsPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await productApi.list(search.trim() || undefined)
      setProducts(data)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchProducts, 300)
    return () => clearTimeout(handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    Promise.all([categoryApi.list(), supplierApi.list()])
      .then(([cats, sups]) => {
        setCategories(cats)
        setSuppliers(sups)
      })
      .catch(() => {})
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      qrCode: p.qrCode,
      buyPrice: String(p.buyPrice),
      sellPrice: String(p.sellPrice),
      quantity: String(p.quantity),
      lowStockThreshold: String(p.lowStockThreshold),
      category: p.category?._id ?? '',
      supplier: p.supplier?._id ?? '',
    })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.sellPrice || !form.buyPrice) {
      toast.error('Nom, prix achat et prix vente sont requis')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        qrCode: form.qrCode.trim(),
        buyPrice: parseFloat(form.buyPrice),
        sellPrice: parseFloat(form.sellPrice),
        quantity: parseInt(form.quantity) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        category: form.category || null,
        supplier: form.supplier || null,
      }
      if (editing) {
        await productApi.update(editing._id, payload)
        toast.success('Produit mis à jour')
      } else {
        await productApi.create(payload)
        toast.success('Produit créé')
      }
      setSheetOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Supprimer "${p.name}" ?`)) return
    try {
      await productApi.remove(p._id)
      toast.success('Produit supprimé')
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('products.title')}</h1>
        {isAdmin && (
          <Button onClick={openAdd} size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            {t('products.addProduct')}
          </Button>
        )}
      </div>

      <Input
        placeholder={`${t('common.search')} par nom ou QR code...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('products.noProducts')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('products.qrCode')}</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-right font-medium">{t('products.buyPrice')}</th>
                )}
                <th className="px-4 py-3 text-right font-medium">{t('products.sellPrice')}</th>
                <th className="px-4 py-3 text-center font-medium">{t('products.stock')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('products.category')}</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {p.qrCode || '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right tabular-nums">{p.buyPrice.toFixed(2)}</td>
                  )}
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {p.sellPrice.toFixed(2)} DZD
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.quantity === 0 ? 'destructive' : p.isLowStock ? 'outline' : 'secondary'}>
                      {p.quantity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category?.name.fr ?? '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => openEdit(p)}
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive size-7"
                          onClick={() => handleDelete(p)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editing ? t('products.editProduct') : t('products.addProduct')}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>{t('common.name')} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du produit"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('products.qrCode')}</Label>
              <Input
                value={form.qrCode}
                onChange={(e) => setForm((f) => ({ ...f, qrCode: e.target.value }))}
                placeholder="Code barre / QR"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('products.buyPrice')} *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.buyPrice}
                  onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('products.sellPrice')} *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.sellPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('common.quantity')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Seuil alerte</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('products.category')}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">— Aucune —</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name.fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('products.supplier')}</Label>
              <Select
                value={form.supplier}
                onValueChange={(v) => setForm((f) => ({ ...f, supplier: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">— Aucun —</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
