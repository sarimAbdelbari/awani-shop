import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  Settings05Icon,
} from '@hugeicons/core-free-icons'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useI18n } from '@/i18n'

type CrumbRoute = {
  parentKey?: string
  parentIcon?: IconSvgElement
  parentTo?: string
  labelKey: string
  icon: IconSvgElement
}

const CRUMB_ROUTES: Record<string, CrumbRoute> = {
  '/dashboard/clients': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    parentTo: '/dashboard/clients',
    labelKey: 'nav.clients',
    icon: UserGroupIcon,
  },
  '/dashboard/products': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    parentTo: '/dashboard/clients',
    labelKey: 'nav.products',
    icon: Package01Icon,
  },
  '/dashboard/suppliers': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    parentTo: '/dashboard/clients',
    labelKey: 'nav.suppliers',
    icon: DistributionIcon,
  },
  '/dashboard/categories': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    parentTo: '/dashboard/clients',
    labelKey: 'nav.categories',
    icon: CombineIcon,
  },
  '/dashboard/lots': {
    parentKey: 'nav.masterData',
    parentIcon: Database01Icon,
    parentTo: '/dashboard/clients',
    labelKey: 'nav.lots',
    icon: Layers01Icon,
  },
  '/dashboard/receptions': {
    parentKey: 'nav.purchases',
    parentIcon: ShoppingBag01Icon,
    parentTo: '/dashboard/stock',
    labelKey: 'nav.receptions',
    icon: PackageReceiveIcon,
  },
  '/dashboard/stock': {
    parentKey: 'nav.purchases',
    parentIcon: ShoppingBag01Icon,
    parentTo: '/dashboard/stock',
    labelKey: 'nav.stock',
    icon: WarehouseIcon,
  },
  '/dashboard/orders': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    parentTo: '/dashboard/orders',
    labelKey: 'nav.venteDirecte',
    icon: Invoice01Icon,
  },
  '/dashboard/rapport': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    parentTo: '/dashboard/orders',
    labelKey: 'nav.salesReport',
    icon: ChartHistogramIcon,
  },
  '/dashboard/caisse': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    parentTo: '/dashboard/orders',
    labelKey: 'nav.caisse',
    icon: Wallet01Icon,
  },
  '/dashboard/frais': {
    parentKey: 'nav.sales',
    parentIcon: Invoice01Icon,
    parentTo: '/dashboard/orders',
    labelKey: 'nav.expenses',
    icon: MoneySend01Icon,
  },
  '/dashboard/ajustements': {
    parentKey: 'nav.purchases',
    parentIcon: ShoppingBag01Icon,
    parentTo: '/dashboard/stock',
    labelKey: 'nav.adjustments',
    icon: Package01Icon,
  },
  '/dashboard': {
    labelKey: 'nav.statistiques',
    icon: ChartHistogramIcon,
  },
  '/dashboard/settings': {
    parentKey: 'nav.statistiques',
    parentIcon: ChartHistogramIcon,
    parentTo: '/dashboard',
    labelKey: 'nav.settings',
    icon: Settings05Icon,
  },
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useI18n()

  const crumb = CRUMB_ROUTES[pathname]

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
              {crumb.parentKey && crumb.parentIcon && crumb.parentTo ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={crumb.parentTo}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
                      >
                        <HugeiconsIcon
                          icon={crumb.parentIcon}
                          strokeWidth={2}
                          className="size-3.5 opacity-70"
                        />
                        <span className="hidden sm:inline">{t(crumb.parentKey)}</span>
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : null}
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to={pathname}
                    aria-current="page"
                    className="bg-primary/10 text-foreground hover:bg-primary/15 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-semibold"
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                      event.preventDefault()
                      window.dispatchEvent(new CustomEvent('awani:breadcrumb', { detail: pathname }))
                      navigate(pathname)
                    }}
                  >
                    <HugeiconsIcon
                      icon={crumb.icon}
                      strokeWidth={2}
                      className="text-primary size-4"
                    />
                    {t(crumb.labelKey)}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="text-base font-medium">{t('nav.statistiques')}</h1>
        )}
      </div>
    </header>
  )
}
