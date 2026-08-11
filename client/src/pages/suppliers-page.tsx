import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { supplierApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import type { Supplier } from '@/types'

const EMPTY_FORM = { name: '', phone: '', email: '', address: '' }

export function SuppliersPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      setSuppliers(await supplierApi.list())
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditing(s)
    setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      if (editing) {
        await supplierApi.update(editing._id, form)
        toast.success('Fournisseur mis à jour')
      } else {
        await supplierApi.create(form)
        toast.success('Fournisseur créé')
      }
      setSheetOpen(false)
      fetchSuppliers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Supprimer "${s.name}" ?`)) return
    try {
      await supplierApi.remove(s._id)
      toast.success('Fournisseur supprimé')
      fetchSuppliers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const field = (key: keyof typeof EMPTY_FORM, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('suppliers.title')}</h1>
        {isAdmin && (
          <Button onClick={openAdd} size="sm">
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
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.phone')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.email')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.address')}</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.address || '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => openEdit(s)}>
                          <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive size-7" onClick={() => handleDelete(s)}>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            {field('name', `${t('common.name')} *`, 'Nom du fournisseur')}
            {field('phone', t('common.phone'), '0555 000 000')}
            {field('email', t('common.email'), 'fournisseur@exemple.com')}
            {field('address', t('common.address'), 'Adresse complète')}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
