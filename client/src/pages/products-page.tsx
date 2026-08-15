import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  PencilEdit01Icon,
  Cancel01Icon,
  Tick02Icon,
  Delete02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'

import {
  CreateProductDialog,
  UpdateProductDialog,
  DeleteProductDialog,
  ViewProductDialog,
} from '@/components/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { categoryApi, productApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast, sucess_toast } from '@/utils/toastNotification'
import type { Category, Product } from '@/types'

export function ProductsPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [viewing, setViewing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await productApi.list({
        search: search.trim() || undefined,
        active: showInactive ? 'all' : 'true',
      })
      setProducts(data)
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchProducts, 300)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showInactive])

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  const toggleActive = async (p: Product) => {
    try {
      if (p.isActive) {
        await productApi.deactivate(p._id)
        sucess_toast(t('products.deactivated'))
      } else {
        await productApi.activate(p._id)
        sucess_toast(t('products.activated'))
      }
      fetchProducts()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('products.title')}</h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            {t('products.addProduct')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={`${t('common.search')}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-primary size-4"
          />
          {t('products.showInactive')}
        </label>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('products.noProducts')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">{t('products.code')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('products.qrCode')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('products.category')}</th>
                <th className="px-4 py-3 text-center font-medium">{t('common.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{p.code}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                    {p.qrCode || '—'}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {p.category ? `${p.category.code} — ${p.category.name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.isActive ? 'secondary' : 'outline'}>
                      {p.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setViewing(p)}
                        title={t('common.view')}
                      >
                        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => setEditing(p)}
                            title={t('common.edit')}
                          >
                            <HugeiconsIcon
                              icon={PencilEdit01Icon}
                              strokeWidth={2}
                              className="size-3.5"
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => toggleActive(p)}
                            title={p.isActive ? t('common.deactivate') : t('common.activate')}
                          >
                            <HugeiconsIcon
                              icon={p.isActive ? Cancel01Icon : Tick02Icon}
                              strokeWidth={2}
                              className="size-3.5"
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive size-7"
                            onClick={() => setDeleting(p)}
                            title={t('common.delete')}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              className="size-3.5"
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        onSuccess={fetchProducts}
      />
      <UpdateProductDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        product={editing}
        categories={categories}
        onSuccess={fetchProducts}
      />
      <ViewProductDialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        product={viewing}
      />
      <DeleteProductDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        product={deleting}
        onSuccess={fetchProducts}
      />
    </div>
  )
}
