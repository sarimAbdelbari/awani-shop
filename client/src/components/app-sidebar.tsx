import * as React from 'react'
import { Link } from 'react-router-dom'

import awaniShopLogo from '@/assets/main/AwaniShop.jpg'

import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChartHistogramIcon,
  UserGroupIcon,
  Settings05Icon,
  HelpCircleIcon,
  Package01Icon,
  Invoice01Icon,
  WarehouseIcon,
  DistributionIcon,
  CombineIcon,
  Layers01Icon,
  PackageReceiveIcon,
} from '@hugeicons/core-free-icons'
import { useI18n } from '@/i18n'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, locale, setLocale } = useI18n()
  const { isAdmin } = useAuth()

  const topNav = [
    {
      title: t('nav.statistiques'),
      url: '/dashboard',
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
    {
      title: t('nav.orders'),
      url: '/dashboard/orders',
      icon: <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />,
    },
  ]

  const purchasesNav = [
    ...(isAdmin
      ? [
          {
            title: t('nav.receptions'),
            url: '/dashboard/receptions',
            icon: <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} />,
          },
        ]
      : []),
    {
      title: t('nav.stock'),
      url: '/dashboard/stock',
      icon: <HugeiconsIcon icon={WarehouseIcon} strokeWidth={2} />,
    },
  ]

  const masterDataNav = [
    {
      title: t('nav.clients'),
      url: '/dashboard/clients',
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
    },
    {
      title: t('nav.products'),
      url: '/dashboard/products',
      icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={2} />,
    },
    ...(isAdmin
      ? [
          {
            title: t('nav.suppliers'),
            url: '/dashboard/suppliers',
            icon: <HugeiconsIcon icon={DistributionIcon} strokeWidth={2} />,
          },
          {
            title: t('nav.categories'),
            url: '/dashboard/categories',
            icon: <HugeiconsIcon icon={CombineIcon} strokeWidth={2} />,
          },
          {
            title: t('nav.lots'),
            url: '/dashboard/lots',
            icon: <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} />,
          },
        ]
      : []),
  ]

  const navSecondary = [
    ...(isAdmin
      ? [
          {
            title: t('nav.settings'),
            url: '/dashboard/settings',
            icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
          },
        ]
      : []),
    {
      title: t('nav.help'),
      url: '#',
      icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard" className="gap-2">
                <img
                  src={awaniShopLogo}
                  alt=""
                  role="presentation"
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-md object-cover"
                  decoding="async"
                />
                <span className="text-base font-semibold">Awani Shop</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={topNav} />
        <NavMain items={purchasesNav} label={t('nav.purchases')} />
        <NavMain items={masterDataNav} label={t('nav.masterData')} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <div className="flex justify-center gap-1 px-2 pb-1">
          <Button
            variant={locale === 'fr' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => setLocale('fr')}
          >
            FR
          </Button>
          <Button
            variant={locale === 'en' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => setLocale('en')}
          >
            EN
          </Button>
        </div>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
