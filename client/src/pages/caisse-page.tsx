import { useCallback, useEffect, useState } from 'react'

import { shiftApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { formatMoney, parseMoney } from '@/lib/vente-search'
import type { Shift, ShiftSnapshot } from '@/types'
import { error_toast, sucess_toast } from '@/utils/toastNotification'

export function CaissePage() {
  const { t } = useI18n()
  const [current, setCurrent] = useState<ShiftSnapshot | null>(null)
  const [history, setHistory] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [floatText, setFloatText] = useState('0')
  const [countedText, setCountedText] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [open, closed] = await Promise.all([shiftApi.current(), shiftApi.list()])
      setCurrent(open)
      setHistory(closed)
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const counted = parseMoney(countedText)
  const expected = current?.expectedCash ?? 0
  const ecart = counted == null ? null : Math.round((counted - expected) * 100) / 100

  const openShift = async () => {
    const openingFloat = parseMoney(floatText)
    if (openingFloat == null) {
      error_toast(t('caisse.invalidAmount'))
      return
    }
    setSaving(true)
    try {
      setCurrent(await shiftApi.open(openingFloat))
      setFloatText('0')
      sucess_toast(t('caisse.opened'))
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const closeShift = async () => {
    if (!current?.shift) return
    if (counted == null) {
      error_toast(t('caisse.invalidAmount'))
      return
    }
    setSaving(true)
    try {
      await shiftApi.close(current.shift._id, { countedCash: counted, note })
      setCountedText('')
      setNote('')
      sucess_toast(t('caisse.closed'))
      await load()
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !current) {
    return <p className="text-muted-foreground p-4 text-sm md:p-6">{t('common.loading')}</p>
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      {current.shift ? (
        <section className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm">
            <p>
              {t('caisse.openingFloat')}:{' '}
              <span className="font-medium tabular-nums">{formatMoney(current.shift.openingFloat)}</span>
            </p>
            <p>
              {t('caisse.tickets')}: <span className="font-medium">{current.ticketCount}</span>
            </p>
            <p>
              {t('caisse.expected')}:{' '}
              <span className="font-medium tabular-nums">{formatMoney(current.expectedCash)}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="counted">{t('caisse.counted')}</Label>
              <Input
                id="counted"
                inputMode="decimal"
                value={countedText}
                onChange={(event) => setCountedText(event.target.value)}
              />
            </div>
            <p className="text-sm">
              {t('caisse.ecart')}:{' '}
              <span className="font-semibold tabular-nums">
                {ecart == null ? '—' : formatMoney(ecart)}
              </span>
            </p>
            <div className="flex flex-col gap-1">
              <Label htmlFor="shift-note">{t('common.note')}</Label>
              <Input id="shift-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            <Button type="button" disabled={saving} onClick={() => void closeShift()}>
              {t('caisse.close')}
            </Button>
          </div>
        </section>
      ) : (
        <section className="flex max-w-sm flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm">{t('caisse.closedHint')}</p>
          <div className="flex flex-col gap-1">
            <Label htmlFor="float">{t('caisse.openingFloat')}</Label>
            <Input
              id="float"
              inputMode="decimal"
              value={floatText}
              onChange={(event) => setFloatText(event.target.value)}
            />
          </div>
          <Button type="button" disabled={saving} onClick={() => void openShift()}>
            {t('caisse.open')}
          </Button>
        </section>
      )}

      <div className="min-w-0 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-3 py-2">{t('common.date')}</th>
              <th className="px-3 py-2">{t('caisse.cashier')}</th>
              <th className="px-3 py-2">{t('caisse.openingFloat')}</th>
              <th className="px-3 py-2">{t('caisse.expected')}</th>
              <th className="px-3 py-2">{t('caisse.counted')}</th>
              <th className="px-3 py-2">{t('caisse.ecart')}</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-8 text-center">
                  {t('caisse.noHistory')}
                </td>
              </tr>
            ) : (
              history.map((shift) => (
                <tr key={shift._id} className="border-t">
                  <td className="px-3 py-2">
                    {shift.closedAt ? new Date(shift.closedAt).toLocaleString('fr-DZ') : '—'}
                  </td>
                  <td className="px-3 py-2">{shift.closedBy?.name || shift.openedBy?.name || '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMoney(shift.openingFloat)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {shift.expectedCash == null ? '—' : formatMoney(shift.expectedCash)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {shift.countedCash == null ? '—' : formatMoney(shift.countedCash)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {shift.ecart == null ? '—' : formatMoney(shift.ecart)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
