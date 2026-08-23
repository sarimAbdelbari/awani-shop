import { useEffect, useState } from 'react'

import {
  CreateSupplierDialog,
  UpdateSupplierDialog,
  DeleteSupplierDialog,
  ViewSupplierDialog,
  SuppliersTable,
} from '@/components/suppliers'
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
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <SuppliersTable
        suppliers={suppliers}
        loading={loading}
        isAdmin={isAdmin}
        onCreate={isAdmin ? () => setCreateOpen(true) : undefined}
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

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
