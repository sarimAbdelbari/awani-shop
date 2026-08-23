import { useEffect, useState } from 'react'

import {
  CreateProductDialog,
  UpdateProductDialog,
  DeleteProductDialog,
  ViewProductDialog,
  ProductsTable,
} from '@/components/products'
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
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [viewing, setViewing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await productApi.list({ active: 'all' })
      setProducts(data)
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <ProductsTable
        products={products}
        categories={categories}
        loading={loading}
        isAdmin={isAdmin}
        onCreate={isAdmin ? () => setCreateOpen(true) : undefined}
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
        onToggleActive={toggleActive}
      />

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
