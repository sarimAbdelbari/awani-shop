import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

const stats = [
  { label: "Clients", value: "0", description: "Registered customers" },
  { label: "Products", value: "0", description: "Catalog items" },
  { label: "Orders (30d)", value: "0", description: "Completed orders" },
  { label: "Low stock", value: "0", description: "SKUs below threshold" },
] as const

const quickLinks = [
  { title: "Clients", description: "Manage customers", to: "/dashboard/clients" },
  { title: "Products", description: "Catalog & pricing", to: "/dashboard/products" },
  { title: "Orders", description: "Fulfillment queue", to: "/dashboard/orders" },
  { title: "Stock", description: "Inventory levels", to: "/dashboard/stock" },
] as const

export function DashboardPage() {
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-muted-foreground text-sm">{today}</p>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Welcome to Awanishop. Connect your data here to replace placeholder
          figures and build out each section from the sidebar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} data-slot="card">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {item.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump to a workspace area.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickLinks.map((item) => (
              <Button
                key={item.to}
                variant="outline"
                className="h-auto justify-between gap-3 py-3"
                asChild
              >
                <Link to={item.to}>
                  <span className="flex flex-col items-start gap-0.5 text-left">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {item.description}
                    </span>
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-4 shrink-0 opacity-60"
                  />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent store events will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground rounded-md border border-dashed px-4 py-10 text-center text-sm">
              No activity yet. Wire your API to show orders, stock changes, and
              sign-ins.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
