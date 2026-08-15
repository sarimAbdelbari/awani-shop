import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'

import {
  CreateCategoryDialog,
  UpdateCategoryDialog,
  DeleteCategoryDialog,
  ViewCategoryDialog,
} from '@/components/categories'
import { Button } from '@/components/ui/button'
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('categories.title')}</h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            {t('categories.addCategory')}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('categories.noCategories')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">{t('common.code')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.name')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setViewing(c)}
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
                            onClick={() => setEditing(c)}
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
                            className="text-destructive size-7"
                            onClick={() => setDeleting(c)}
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
