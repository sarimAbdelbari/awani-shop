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
import { clientApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import type { Client } from '@/types'

const EMPTY_FORM = { fullName: '', phone: '' }

export function ClientsPage() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchClients = async () => {
    setLoading(true)
    try {
      setClients(await clientApi.list(search.trim() || undefined))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchClients, 300)
    return () => clearTimeout(handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({ fullName: c.fullName, phone: c.phone })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error('Le nom complet est requis'); return }
    setSaving(true)
    try {
      if (editing) {
        await clientApi.update(editing._id, form)
        toast.success('Client mis à jour')
      } else {
        await clientApi.create(form)
        toast.success('Client créé')
      }
      setSheetOpen(false)
      fetchClients()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Client) => {
    if (!confirm(`Supprimer "${c.fullName}" ?`)) return
    try {
      await clientApi.remove(c._id)
      toast.success('Client supprimé')
      fetchClients()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('clients.title')}</h1>
        <Button onClick={openAdd} size="sm">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          {t('clients.addClient')}
        </Button>
      </div>

      <Input
        placeholder={`${t('common.search')} par nom ou téléphone...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : clients.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('clients.noClients')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('clients.fullName')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('common.phone')}</th>
                <th className="px-4 py-3 text-center font-medium">{t('clients.loyaltyPoints')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('clients.totalSpent')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('clients.since')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {c.loyaltyPoints > 0 ? (
                      <Badge variant="secondary">{c.loyaltyPoints} pts</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {c.totalSpent.toFixed(2)} DZD
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('fr-DZ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => openEdit(c)}>
                        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" className="text-destructive size-7" onClick={() => handleDelete(c)}>
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{editing ? t('clients.editClient') : t('clients.addClient')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>{t('clients.fullName')} *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Ahmed Benali"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.phone')}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0555 000 000"
                type="tel"
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
