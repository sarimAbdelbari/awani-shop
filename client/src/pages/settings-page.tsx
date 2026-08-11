import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authApi, settingsApi } from '@/api'
import { useI18n } from '@/i18n'
import type { AuthUser, Settings } from '@/types'

export function SettingsPage() {
  const { t } = useI18n()

  const [settings, setSettings] = useState<Settings | null>(null)
  const [form, setForm] = useState({
    loyaltyThreshold: '',
    loyaltyReward: '',
    shopName: '',
    currency: '',
  })
  const [saving, setSaving] = useState(false)

  const [users, setUsers] = useState<AuthUser[]>([])
  const [userSheetOpen, setUserSheetOpen] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'cashier' })
  const [userSaving, setUserSaving] = useState(false)

  useEffect(() => {
    settingsApi.get().then((s) => {
      setSettings(s)
      setForm({
        loyaltyThreshold: String(s.loyaltyThreshold),
        loyaltyReward: String(s.loyaltyReward),
        shopName: s.shopName,
        currency: s.currency,
      })
    }).catch(() => toast.error(t('common.error')))

    authApi.getUsers().then(setUsers).catch(() => {})
  }, [t])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updated = await settingsApi.update({
        loyaltyThreshold: parseFloat(form.loyaltyThreshold) || 1000,
        loyaltyReward: parseFloat(form.loyaltyReward) || 50,
        shopName: form.shopName.trim(),
        currency: form.currency.trim(),
      })
      setSettings(updated)
      toast.success(t('settings.saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.password) {
      toast.error('Tous les champs sont requis')
      return
    }
    setUserSaving(true)
    try {
      await authApi.createUser(userForm)
      toast.success('Utilisateur créé')
      setUserSheetOpen(false)
      setUserForm({ name: '', username: '', password: '', role: 'cashier' })
      const updated = await authApi.getUsers()
      setUsers(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setUserSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await authApi.deleteUser(id)
      toast.success('Utilisateur supprimé')
      setUsers((u) => u.filter((x) => x.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  if (!settings) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>

      {/* Loyalty & shop settings */}
      <div className="max-w-lg rounded-lg border p-6">
        <h2 className="mb-4 text-base font-semibold">Boutique &amp; Fidélité</h2>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>{t('settings.shopName')}</Label>
            <Input
              value={form.shopName}
              onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.currency')}</Label>
            <Input
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="w-24"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.loyaltyThreshold')}</Label>
            <p className="text-muted-foreground text-xs">{t('settings.loyaltyThresholdHelp')}</p>
            <Input
              type="number"
              min={1}
              value={form.loyaltyThreshold}
              onChange={(e) => setForm((f) => ({ ...f, loyaltyThreshold: e.target.value }))}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.loyaltyReward')}</Label>
            <p className="text-muted-foreground text-xs">{t('settings.loyaltyRewardHelp')}</p>
            <Input
              type="number"
              min={0}
              value={form.loyaltyReward}
              onChange={(e) => setForm((f) => ({ ...f, loyaltyReward: e.target.value }))}
              className="w-40"
            />
          </div>
          <Button onClick={handleSaveSettings} disabled={saving} className="w-fit">
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </div>

      {/* Users management */}
      <div className="max-w-lg rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('settings.users')}</h2>
          <Button size="sm" onClick={() => setUserSheetOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            {t('settings.addUser')}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-muted-foreground text-xs">
                  @{u.id} · {u.role === 'admin' ? t('settings.roles.admin') : t('settings.roles.cashier')}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive size-7"
                onClick={() => handleDeleteUser(u.id)}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* New user sheet */}
      <Sheet open={userSheetOpen} onOpenChange={setUserSheetOpen}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{t('settings.addUser')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Nom complet *</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ahmed Benali"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('auth.username')} *</Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="ahmed.benali"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('auth.password')} *</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.userRole')}</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">{t('settings.roles.cashier')}</SelectItem>
                  <SelectItem value="admin">{t('settings.roles.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleCreateUser} disabled={userSaving}>
                {userSaving ? t('common.loading') : t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setUserSheetOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
