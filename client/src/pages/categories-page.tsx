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
import { categoryApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import type { Category } from '@/types'

export function CategoriesPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ fr: '', en: '' })
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      setCategories(await categoryApi.list())
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setEditing(null)
    setForm({ fr: '', en: '' })
    setSheetOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({ fr: c.name.fr, en: c.name.en })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.fr.trim() || !form.en.trim()) {
      toast.error('Les deux noms (FR et EN) sont requis')
      return
    }
    setSaving(true)
    try {
      const payload = { name: { fr: form.fr.trim(), en: form.en.trim() } }
      if (editing) {
        await categoryApi.update(editing._id, payload)
        toast.success('Catégorie mise à jour')
      } else {
        await categoryApi.create(payload)
        toast.success('Catégorie créée')
      }
      setSheetOpen(false)
      fetchCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Category) => {
    if (!confirm(`Supprimer "${c.name.fr}" ?`)) return
    try {
      await categoryApi.remove(c._id)
      toast.success('Catégorie supprimée')
      fetchCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('categories.title')}</h1>
        {isAdmin && (
          <Button onClick={openAdd} size="sm">
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
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nom (FR)</th>
                <th className="px-4 py-3 text-left font-medium">Nom (EN)</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name.fr}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.name.en}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => openEdit(c)}>
                          <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive size-7" onClick={() => handleDelete(c)}>
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
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>
              {editing ? t('categories.editCategory') : t('categories.addCategory')}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>{t('categories.nameFr')} *</Label>
              <Input
                value={form.fr}
                onChange={(e) => setForm((f) => ({ ...f, fr: e.target.value }))}
                placeholder="Électronique"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('categories.nameEn')} *</Label>
              <Input
                value={form.en}
                onChange={(e) => setForm((f) => ({ ...f, en: e.target.value }))}
                placeholder="Electronics"
              />
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
