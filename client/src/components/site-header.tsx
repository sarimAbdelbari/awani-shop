import { useLocation } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Package01Icon,
  UserGroupIcon,
  DistributionIcon,
  CombineIcon,
  Database01Icon,
  Layers01Icon,
  Invoice01Icon,
  ChartHistogramIcon,
  Wallet01Icon,
  MoneySend01Icon,
  PackageReceiveIcon,
  WarehouseIcon,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useI18n } from '@/i18n'

type CrumbRoute = {
  parentKey?: string
  parentIcon?: IconSvgElement
  labelKey: string
  icon: IconSvgElement
}

const CRUMB_ROUTES: Record<string, CrumbRoute> = {
  '/dashboard/clients': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    labelKey: 'nav.clients',
    icon: UserGroupIcon,
  },
  '/dashboard/products': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    labelKey: 'nav.products',
    icon: Package01Icon,
  },
  '/dashboard/suppliers': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    labelKey: 'nav.suppliers',
    icon: DistributionIcon,
  },
  '/dashboard/categories': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    labelKey: 'nav.categories',
    icon: CombineIcon,
  },
  '/dashboard/lots': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    labelKey: 'nav.lots',
    icon: Layers01Icon,
  },
  '/dashboard/receptions': {
    parentKey: 'nav.purchases',
    parentIcon: ShoppingBag01Icon,
    labelKey: 'nav.receptions',
    icon: PackageReceiveIcon,
  },
  '/dashboard/stock': {
    parentKey: 'nav.purchases',
    parentIcon: ShoppingBag01Icon,
    labelKey: 'nav.stock',
    icon: WarehouseIcon,
  },
  '/dashboard/orders': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    labelKey: 'nav.venteDirecte',
    icon: Invoice01Icon,
  },
  '/dashboard/rapport': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    labelKey: 'nav.salesReport',
    icon: ChartHistogramIcon,
  },
  '/dashboard/caisse': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    labelKey: 'nav.caisse',
    icon: Wallet01Icon,
  },
  '/dashboard/frais': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    labelKey: 'nav.expenses',
    icon: MoneySend01Icon,
  },
  '/dashboard/ajustements': {
    parentKey: 'nav.purchases',
    parentIcon: ShoppingBag01Icon,
    labelKey: 'nav.adjustments',
    icon: Package01Icon,
  },
  '/dashboard': {
    labelKey: 'nav.statistiques',
    icon: ChartHistogramIcon,
  },
}

const SIMPLE_TITLES: Record<string, string> = {
  '/dashboard/settings': 'nav.settings',
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  const crumb = CRUMB_ROUTES[pathname]
  const simpleTitleKey = SIMPLE_TITLES[pathname]

  return (
    <header className="flex h-(--header-height) min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex min-w-0 w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {crumb ? (
          <Breadcrumb>
            <BreadcrumbList className="sm:gap-2">
              {crumb.parentKey && crumb.parentIcon ? (
                <>
                  <BreadcrumbItem>
                    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm font-medium">
                      <HugeiconsIcon
                        icon={crumb.parentIcon}
                        strokeWidth={2}
                        className="size-3.5 opacity-70"
                      />
                      <span className="hidden sm:inline">{t(crumb.parentKey)}</span>
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : null}
              <BreadcrumbItem>
                <BreadcrumbPage className="bg-primary/10 text-foreground inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={crumb.icon}
                    strokeWidth={2}
                    className="text-primary size-4"
                  />
                  {t(crumb.labelKey)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="text-base font-medium">
            {simpleTitleKey ? t(simpleTitleKey) : t('nav.statistiques')}
          </h1>
        )}
      </div>
    </header>
  )
}
