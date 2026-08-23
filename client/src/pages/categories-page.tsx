import { useEffect, useState } from 'react'

import {
  CreateCategoryDialog,
  UpdateCategoryDialog,
  DeleteCategoryDialog,
  ViewCategoryDialog,
  CategoriesTable,
} from '@/components/categories'
import { categoryApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast } from '@/utils/toastNotification'
import type { Category } from '@/types'

export function CategoriesPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [viewing, setViewing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      setCategories(await categoryApi.list())
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <CategoriesTable
        categories={categories}
        loading={loading}
        isAdmin={isAdmin}
        onCreate={isAdmin ? () => setCreateOpen(true) : undefined}
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchCategories}
      />
      <UpdateCategoryDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        category={editing}
        onSuccess={fetchCategories}
      />
      <ViewCategoryDialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        category={viewing}
      />
      <DeleteCategoryDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        category={deleting}
        onSuccess={fetchCategories}
      />
    </div>
  )
}
