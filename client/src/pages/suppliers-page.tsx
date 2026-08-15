import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'

import {
  CreateSupplierDialog,
  UpdateSupplierDialog,
  DeleteSupplierDialog,
  ViewSupplierDialog,
} from '@/components/suppliers'
import { Button } from '@/components/ui/button'
import { supplierApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast } from '@/utils/toastNotification'
import type { Supplier } from '@/types'

export function SuppliersPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [viewing, setViewing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      setSuppliers(await supplierApi.list())
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('suppliers.title')}</h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            {t('suppliers.addSupplier')}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : suppliers.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('suppliers.noSuppliers')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">{t('suppliers.fullName')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.phone')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('suppliers.location')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('suppliers.nif')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('suppliers.nis')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('suppliers.rc')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.fullName}</td>
                  <td className="text-muted-foreground px-4 py-3">{s.phone || '—'}</td>
                  <td className="text-muted-foreground px-4 py-3">{s.location || '—'}</td>
                  <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                    {s.nif || '—'}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                    {s.nis || '—'}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                    {s.rc || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setViewing(s)}
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
                            onClick={() => setEditing(s)}
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
                            onClick={() => setDeleting(s)}
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

      <CreateSupplierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchSuppliers}
      />
      <UpdateSupplierDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        supplier={editing}
        onSuccess={fetchSuppliers}
      />
      <ViewSupplierDialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        supplier={viewing}
      />
      <DeleteSupplierDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        supplier={deleting}
        onSuccess={fetchSuppliers}
      />
    </div>
  )
}
