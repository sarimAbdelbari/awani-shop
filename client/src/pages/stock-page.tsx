import { useI18n } from '@/i18n'

/** Temporary placeholder — Achats / Stock / Inventaire slice will replace this. */
export function StockPage() {
  const { t } = useI18n()

  return (
    <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t('stock.title')}</h1>
      <p className="text-muted-foreground max-w-xl text-sm">
        Cette section sera refaite avec Achats (lots, réceptions) et Inventaire. Le stock
        n&apos;est plus un champ du produit.
      </p>
    </div>
  )
}
