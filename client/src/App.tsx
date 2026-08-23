import * as React from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppToastContainer } from '@/components/app-toast-container'

import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { OrdersPage } from '@/pages/orders-page'
import { ProductsPage } from '@/pages/products-page'
import { StockPage } from '@/pages/stock-page'
import { SuppliersPage } from '@/pages/suppliers-page'
import { CategoriesPage } from '@/pages/categories-page'
import { ClientsPage } from '@/pages/clients-page'
import { LotsPage } from '@/pages/lots-page'
import { ReceptionsPage } from '@/pages/receptions-page'
import { SettingsPage } from '@/pages/settings-page'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

function DashboardLayout() {
  return (
    <SidebarProvider
      className="h-svh max-w-full overflow-hidden"
      style={
        {
          '--sidebar-width': '18rem',
          '--header-height': '3rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-w-0 w-full">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <>
    <AppToastContainer />
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="stock" element={<StockPage />} />

        {/* Admin-only routes */}
        <Route
          path="suppliers"
          element={
            <RequireAdmin>
              <SuppliersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="categories"
          element={
            <RequireAdmin>
              <CategoriesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="lots"
          element={
            <RequireAdmin>
              <LotsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="receptions"
          element={
            <RequireAdmin>
              <ReceptionsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="settings"
          element={
            <RequireAdmin>
              <SettingsPage />
            </RequireAdmin>
          }
        />
        <Route path="statistiques" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}
