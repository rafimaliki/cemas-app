import React, { useState, useEffect } from 'react'
import { Link, useMatchRoute, useRouter } from '@tanstack/react-router'
import {
  BarChart3,
  FileCheck,
  FileText,
  LogOut,
  UserRoundCog,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useUserStore } from '@/stores/user-store'
import type { UserInfo } from '@/stores/user-store'
import { cn } from '@/lib/utils'
import { CustomSidebarTriggerAlt } from '@/components/layout/sidebar-trigger'
import { useSidebar } from '@/components/ui/sidebar'

const navData = {
  navMain: [
    { title: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { title: 'Compliance', icon: FileCheck, href: '/compliance', items: [] },
    { title: 'Evidence', icon: FileText, href: '/evidence' },
    { title: 'Manage User', icon: UserRoundCog, href: '/manage-user' },
  ],
}

function useActiveRoute() {
  const matchRoute = useMatchRoute()
  return React.useCallback(
    (href: string) => !!matchRoute({ to: href, fuzzy: true }),
    [matchRoute],
  )
}

function SidebarLogo() {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isOpen = state === 'expanded'

  if (!isOpen) {
    return null
  }

  return (
    <SidebarHeader className="mr-auto  h-full w-full">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="h-fit" asChild>
            <Link to="/">
              {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-semibold">C</span>
              </div> */}
              <div className="flex flex-col gap-0.5 leading-none ">
                <span className=" w-full text-2xl font-bold">CeMaS</span>
                {/* <span className="text-xs text-muted-foreground">
                  Compliance Management System
                </span> */}
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

function NavItem({
  item,
  compliances,
}: {
  item: (typeof navData.navMain)[0]
  compliances: { title: string; href: string }[]
}) {
  const isActive = useActiveRoute()

  if (item.title === 'Compliance') {
    return <CollapsibleNavItem item={item} compliances={compliances} />
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.href)}
        tooltip={item.title}
      >
        <Link to={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapsibleNavItem({
  item,
  compliances,
}: {
  item: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    href?: string
    items?: any[]
  }
  compliances: { title: string; href: string }[]
}) {
  const isActive = useActiveRoute()

  const anySubItemActive = React.useMemo(() => {
    return compliances?.some((subItem) => isActive(subItem.href))
  }, [compliances, isActive])

  return (
    <Collapsible defaultOpen={anySubItemActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            data-active={anySubItemActive}
            className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <Plus className="ml-auto h-4 w-4 group-data-[state=open]/collapsible:hidden" />
            <Minus className="ml-auto h-4 w-4 group-data-[state=closed]/collapsible:hidden" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {compliances.map((subItem) => {
              const subItemActive = isActive(subItem.href)
              return (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={subItemActive}
                    className="data-[active=true]:font-medium"
                  >
                    <Link
                      to={subItem.href}
                      className={cn('truncate', subItemActive && 'font-medium')}
                    >
                      <span
                        className={cn(
                          'truncate',
                          subItemActive && 'font-medium',
                        )}
                        title={subItem.title}
                      >
                        {subItem.title}
                      </span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function UserProfile() {
  const user = useUserStore.getState().getStoredUser() as UserInfo
  return (
    <SidebarFooter className="">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="py-6 ">
                <Avatar className="h-6 w-6 shrink-0 rounded-md -ml-1">
                  <AvatarImage
                    src={user?.picture || '/placeholder.svg'}
                    alt="User"
                    className="rounded-md"
                  />
                  <AvatarFallback className="rounded-md">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col items-start text-sm">
                  <span
                    className="font-medium truncate w-full"
                    title={user?.name}
                  >
                    {user?.name}
                  </span>
                  <span
                    className="text-xs text-muted-foreground truncate w-full"
                    title={user?.role}
                  >
                    ({user?.role})
                  </span>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <UserProfileDropdown user={user} />
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

function UserProfileDropdown({ user }: { user?: UserInfo }) {
  const router = useRouter()
  return (
    <DropdownMenuContent
      align="end"
      className="w-fit translate-x-1 -translate-y-5"
    >
      <div className="flex items-center gap-2 p-2">
        <Avatar className="h-8 w-8 rounded-md border">
          <AvatarImage src={user?.picture || '/placeholder.svg'} alt="User" />
          <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-0.5 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            ({user?.role})
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => router.navigate({ to: '/logout' })}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

function MainNavigation({
  compliances,
}: {
  compliances: { title: string; href: string }[]
}) {
  const user = useUserStore.getState().getStoredUser() as UserInfo

  let visibleNavItems = navData.navMain

  if (user.role === 'Contributor') {
    visibleNavItems = navData.navMain.slice(0, 3)
  } else if (user.role === 'Auditor') {
    visibleNavItems = navData.navMain.slice(0, 2)
  }

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <NavItem key={item.title} item={item} compliances={compliances} />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  )
}

import { useKeyStore } from '@/stores/key-store'

export function AppSidebar() {
  const [compliances, setCompliances] = useState<
    { title: string; href: string }[]
  >([])

  const key = useKeyStore((state: { key: string }) => state.key)

  useEffect(() => {
    async function fetchCompliances() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/compliance`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          },
        )

        if (!response.ok) throw new Error('Failed to fetch compliance data')

        const data = await response.json()
        const fetched = data.data.map((c: any) => ({
          title: c.name,
          href: `/compliance/${c.id}`,
        }))

        setCompliances([...fetched])
      } catch (error) {
        console.error('Error fetching compliance data:', error)
      }
    }

    fetchCompliances()
  }, [key])

  return (
    <Sidebar collapsible="icon" className="border-neutral-50">
      <div className="flex items-center h-fit">
        <SidebarLogo />
        <CustomSidebarTriggerAlt className="w-8 h-8 m-2" />
      </div>
      <MainNavigation compliances={compliances} />
      <UserProfile />
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}
