import { useEffect, useState } from 'react'

import { lotApi, productApi, receptionApi, supplierApi, type ReceptionPayload } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { ReceptionForm } from '@/components/receptions/reception-form'
import {
  emptyLineDraft,
  lineToDraft,
  type ReceptionLineDraft,
} from '@/components/receptions/reception-helpers'
import { DeleteReceptionDialog } from '@/components/receptions/delete-reception-dialog'
import { ViewReceptionDialog } from '@/components/receptions/view-reception-dialog'
import { ReceptionsTable } from '@/components/receptions/receptions-table'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast, sucess_toast } from '@/utils/toastNotification'
import type { Lot, Product, Reception, Supplier } from '@/types'

export function ReceptionsPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [receptions, setReceptions] = useState<Reception[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editing, setEditing] = useState<Reception | null>(null)
  const [viewing, setViewing] = useState<Reception | null>(null)
  const [deleting, setDeleting] = useState<Reception | null>(null)

  const [supplierId, setSupplierId] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<ReceptionLineDraft[]>([emptyLineDraft()])

  const fetchReceptions = async () => {
    setLoading(true)
    try {
      setReceptions(await receptionApi.list())
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceptions()
    productApi.list({ active: 'all' }).then(setProducts).catch(() => {})
    lotApi.list().then(setLots).catch(() => {})
    supplierApi.list().then(setSuppliers).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null)
    setSupplierId('')
    setNote('')
    setLines([emptyLineDraft()])
    setMode('create')
  }

  const openEdit = (reception: Reception) => {
    setEditing(reception)
    setSupplierId(typeof reception.supplier === 'string' ? reception.supplier : reception.supplier._id)
    setNote(reception.note || '')
    setLines(reception.lines.map(lineToDraft))
    setMode('edit')
  }

  const closeForm = () => {
    setMode('list')
    setEditing(null)
  }

  const buildPayload = (): ReceptionPayload | null => {
    if (!supplierId) {
      error_toast(t('receptions.needSupplier'))
      return null
    }
    if (lines.length === 0) {
      error_toast(t('receptions.needLine'))
      return null
    }
    for (const line of lines) {
      if (!line.product || !line.lot) {
        error_toast(t('receptions.needProductLot'))
        return null
      }
      if (line.status === 'R' && !line.observation.trim()) {
        error_toast(t('receptions.observationRequired'))
        return null
      }
      if (!Number.isFinite(Number(line.quantity)) || Number(line.quantity) < 1) {
        error_toast(t('receptions.invalidQuantity'))
        return null
      }
      if (!Number.isFinite(Number(line.buyPrice)) || Number(line.buyPrice) < 0) {
        error_toast(t('receptions.invalidPrice'))
        return null
      }
      if (!Number.isFinite(Number(line.sellPrice)) || Number(line.sellPrice) < 0) {
        error_toast(t('receptions.invalidPrice'))
        return null
      }
    }
    return {
      supplier: supplierId,
      note: note.trim(),
      lines: lines.map((line) => ({
        product: line.product,
        lot: line.lot,
        quantity: Number(line.quantity),
        status: line.status,
        buyPrice: Number(line.buyPrice),
        sellPrice: Number(line.sellPrice),
        expiryDate: line.expiryDate || null,
        observation: line.observation.trim(),
      })),
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = buildPayload()
    if (!payload) return
    setSaving(true)
    try {
      if (mode === 'edit' && editing) {
        await receptionApi.update(editing._id, payload)
        sucess_toast(t('receptions.updated'))
      } else {
        await receptionApi.create(payload)
        sucess_toast(t('receptions.created'))
      }
      closeForm()
      fetchReceptions()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (mode !== 'list') {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {mode === 'edit' ? t('receptions.editReception') : t('receptions.addReception')}
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={closeForm} disabled={saving}>
            {t('receptions.backToList')}
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ReceptionForm
            supplierId={supplierId}
            onSupplierChange={setSupplierId}
            note={note}
            onNoteChange={setNote}
            lines={lines}
            onLinesChange={setLines}
            suppliers={suppliers}
            products={products}
            lots={lots}
            disabled={saving}
            receptionNumber={editing?.number}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <ReceptionsTable
        receptions={receptions}
        loading={loading}
        isAdmin={isAdmin}
        onCreate={isAdmin ? openCreate : undefined}
        onView={setViewing}
        onEdit={openEdit}
        onDelete={setDeleting}
      />
      <ViewReceptionDialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        reception={viewing}
      />
      <DeleteReceptionDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        reception={deleting}
        onSuccess={fetchReceptions}
      />
    </div>
  )
}
