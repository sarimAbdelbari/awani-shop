import * as React from 'react'
import { Link } from 'react-router-dom'

import awaniLogo from '@/assets/main/AwaniLogo.png'

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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Wallet01Icon,
  MoneySend01Icon,
} from '@hugeicons/core-free-icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { useI18n } from '@/i18n'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

function LocaleToggle({
  code,
  label,
  active,
  onClick,
}: {
  code: 'fr' | 'en'
  label: string
  active: boolean
  onClick: () => void
}) {
  const { state, isMobile } = useSidebar()
  const button = (
    <Button
      variant={active ? 'default' : 'ghost'}
      size="sm"
      className="h-7 flex-1 text-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:shrink-0 group-data-[collapsible=icon]:p-0"
      onClick={onClick}
    >
      {code.toUpperCase()}
    </Button>
  )

  if (state === 'collapsed' && !isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, locale, setLocale } = useI18n()
  const { isAdmin } = useAuth()

  const topNav = [
    {
      title: t('nav.statistiques'),
      url: '/dashboard',
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
  ]

  const salesNav = [
    {
      title: t('nav.venteDirecte'),
      url: '/dashboard/orders',
      icon: <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />,
    },
    {
      title: t('nav.salesReport'),
      url: '/dashboard/rapport',
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
    {
      title: t('nav.caisse'),
      url: '/dashboard/caisse',
      icon: <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />,
    },
    ...(isAdmin
      ? [
          {
            title: t('nav.expenses'),
            url: '/dashboard/frais',
            icon: <HugeiconsIcon icon={MoneySend01Icon} strokeWidth={2} />,
          },
        ]
      : []),
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
    {
      title: t('nav.adjustments'),
      url: '/dashboard/ajustements',
      icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={2} />,
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Awani Shop"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard" className="gap-2">
                <img
                  src={awaniLogo}
                  alt=""
                  role="presentation"
                  width={40}
                  height={40}
                  className="size-9 scale-125 shrink-0 object-contain brightness-0 saturate-100 dark:invert group-data-[collapsible=icon]:size-8"
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
        <NavMain items={salesNav} label={t('nav.sales')} />
        <NavMain items={purchasesNav} label={t('nav.purchases')} />
        <NavMain items={masterDataNav} label={t('nav.masterData')} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <div className="flex justify-center gap-1 px-2 pb-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-1">
          <LocaleToggle
            code="fr"
            label={t('common.french')}
            active={locale === 'fr'}
            onClick={() => setLocale('fr')}
          />
          <LocaleToggle
            code="en"
            label={t('common.english')}
            active={locale === 'en'}
            onClick={() => setLocale('en')}
          />
          <ThemeToggle className="size-7 shrink-0 group-data-[collapsible=icon]:size-8" />
        </div>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
