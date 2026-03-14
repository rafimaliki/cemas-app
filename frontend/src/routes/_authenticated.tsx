import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { useUserStore } from '@/stores/user-store'
import { useState } from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const user = useUserStore.getState().getStoredUser()

  if (!user) {
    return <Navigate to="/login" search={{ redirect: window.location.href }} />
  }

  return (
    <div className="flex w-screen min-h-screen overflow-hidden scrollbar-hide bg-neutral-50">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden m-2 bg-white rounded-lg shadow-md">
          <div className="flex-1 overflow-auto p-3 scrollbar-hide">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}
