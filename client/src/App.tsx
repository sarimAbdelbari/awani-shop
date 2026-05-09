import * as React from "react"
import { Navigate, Outlet, Route, Routes } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { DashboardPage } from "@/pages/dashboard-page"
import { LoginPage } from "@/pages/login-page"

function DashboardLayout() {
  return (
    <SidebarProvider
      className="min-h-svh w-full"
      style={
        {
          /* Use rem — `var(--spacing)` is not defined in this project and breaks
             `w-(--sidebar-width)` / layout when it overrides the provider defaults. */
          "--sidebar-width": "18rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <Outlet />
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col gap-2 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">
        This section is ready for your content.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="clients"
          element={<PlaceholderPage title="Clients" />}
        />
        <Route
          path="products"
          element={<PlaceholderPage title="Products" />}
        />
        <Route path="orders" element={<PlaceholderPage title="Orders" />} />
        <Route path="stock" element={<PlaceholderPage title="Stock" />} />
        <Route
          path="statistiques"
          element={<PlaceholderPage title="Statistiques" />}
        />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
