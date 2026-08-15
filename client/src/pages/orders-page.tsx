import { useI18n } from '@/i18n'

/** Temporary placeholder — Vente slice will replace this with POS + reports. */
export function OrdersPage() {
  const { t } = useI18n()

  return (
    <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t('orders.title')}</h1>
      <p className="text-muted-foreground max-w-xl text-sm">
        Cette section sera refaite dans le module Vente (vente directe + rapport). Les prix
        et le stock ne sont plus sur le produit — ils arriveront avec Achats / Stock.
      </p>
    </div>
  )
}
