import { useCallback, useEffect, useState } from 'react'

import { expenseApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { formatMoney, parseMoney } from '@/lib/vente-search'
import type { Expense, ExpenseCategory } from '@/types'
import { error_toast, sucess_toast } from '@/utils/toastNotification'

const CATEGORIES: ExpenseCategory[] = ['loyer', 'electricite', 'eau', 'salaires', 'autre']

function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function monthStart() {
  const now = new Date()
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

function dayOf(value: string) {
  return isoDate(new Date(value))
}

type FormState = {
  date: string
  name: string
  category: ExpenseCategory
  amount: string
  note: string
}

const emptyForm = (): FormState => ({
  date: isoDate(new Date()),
  name: '',
  category: 'loyer',
  amount: '',
  note: '',
})

export function ExpensesPage() {
  const { t } = useI18n()
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [rows, setRows] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [removing, setRemoving] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await expenseApi.list({ from, to }))
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }, [from, to, t])

  useEffect(() => {
    void load()
  }, [load])

  const saveNew = async () => {
    const name = form.name.trim()
    if (!name) {
      error_toast(t('expenses.nameRequired'))
      return
    }
    const amount = parseMoney(form.amount)
    if (amount == null || amount <= 0) {
      error_toast(t('expenses.invalidAmount'))
      return
    }
    setSaving(true)
    try {
      await expenseApi.create({
        date: form.date,
        name,
        category: form.category,
        amount,
        note: form.note,
      })
      setForm(emptyForm())
      sucess_toast(t('expenses.saved'))
      await load()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    const name = editForm.name.trim()
    if (!name) {
      error_toast(t('expenses.nameRequired'))
      return
    }
    const amount = parseMoney(editForm.amount)
    if (amount == null || amount <= 0) {
      error_toast(t('expenses.invalidAmount'))
      return
    }
    setSaving(true)
    try {
      await expenseApi.update(editing._id, {
        date: editForm.date,
        name,
        category: editForm.category,
        amount,
        note: editForm.note,
      })
      setEditing(null)
      sucess_toast(t('expenses.saved'))
      await load()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    setSaving(true)
    try {
      await expenseApi.remove(removing._id)
      setRemoving(null)
      sucess_toast(t('expenses.deleted'))
      await load()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-from">{t('report.dateFrom')}</Label>
          <Input id="frais-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-to">{t('report.dateTo')}</Label>
          <Input id="frais-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border p-4 md:grid-cols-5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-name">{t('common.name')}</Label>
          <Input
            id="frais-name"
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-date">{t('common.date')}</Label>
          <Input
            id="frais-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-cat">{t('expenses.category')}</Label>
          <select
            id="frais-cat"
            value={form.category}
            onChange={(e) =>
              setForm((current) => ({ ...current, category: e.target.value as ExpenseCategory }))
            }
            className="border-input bg-input/30 h-9 rounded-4xl border px-3 text-sm"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {t(`expenses.categories.${item}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-amount">{t('expenses.amount')}</Label>
          <Input
            id="frais-amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="frais-note">{t('common.note')}</Label>
          <Input
            id="frais-note"
            value={form.note}
            onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
          />
        </div>
        <Button type="button" className="md:col-span-5 md:w-fit" disabled={saving} onClick={() => void saveNew()}>
          {t('expenses.add')}
        </Button>
      </section>

      <div className="min-w-0 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-3 py-2">{t('common.date')}</th>
              <th className="px-3 py-2">{t('common.name')}</th>
              <th className="px-3 py-2">{t('expenses.category')}</th>
              <th className="px-3 py-2">{t('expenses.amount')}</th>
              <th className="px-3 py-2">{t('common.note')}</th>
              <th className="px-3 py-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-8 text-center">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-8 text-center">
                  {t('expenses.noRows')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="px-3 py-2">{dayOf(row.date)}</td>
                  <td className="px-3 py-2">{row.name || '-'}</td>
                  <td className="px-3 py-2">{t(`expenses.categories.${row.category}`)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMoney(row.amount)}</td>
                  <td className="px-3 py-2">{row.note || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditing(row)
                          setEditForm({
                            date: dayOf(row.date),
                            name: row.name || '',
                            category: row.category,
                            amount: String(row.amount),
                            note: row.note,
                          })
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button type="button" size="xs" variant="destructive" onClick={() => setRemoving(row)}>
                        {t('common.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={editing != null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('expenses.edit')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              aria-label={t('common.name')}
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
            <select
              value={editForm.category}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
              className="border-input bg-input/30 h-9 rounded-4xl border px-3 text-sm"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {t(`expenses.categories.${item}`)}
                </option>
              ))}
            </select>
            <Input value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} />
            <Input value={editForm.note} onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void saveEdit()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removing != null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="h-auto max-h-none min-h-0 overflow-visible sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="destructive" disabled={saving} onClick={() => void confirmRemove()}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
