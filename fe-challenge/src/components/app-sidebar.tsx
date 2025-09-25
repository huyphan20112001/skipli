'use client'

import { ListChecks, Send, User } from 'lucide-react'
import * as React from 'react'

import { NavMain } from '@src/components/nav-main'
import { NavUser } from '@src/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@src/components/ui/sidebar'
import { PATHNAME } from '@src/constants/pathname'
import { useUserDetails } from '@src/hooks/useUserDetails'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: userDetails } = useUserDetails()

  const user = userDetails?.data.data?.user

  const allNavItems = [
    {
      title: 'Manage Employees',
      url: PATHNAME.MANAGE_EMPLOYEES,
      icon: User,
      roles: ['owner'],
    },
    {
      title: 'Manage Tasks',
      url: PATHNAME.MANAGE_TASKS,
      icon: ListChecks,
      roles: ['owner', 'employee'],
    },
    {
      title: 'Messages',
      url: PATHNAME.MESSAGES,
      icon: Send,
      roles: ['employee', 'owner'],
    },
  ]

  const navMain = allNavItems.filter((item) => item.roles.includes(user?.role))

  const data = {
    user: {
      name: user?.username || user?.phoneNumber || 'User',
      email: user?.email || user?.phoneNumber || 'No email',
      avatar: '/avatars/shadcn.jpg',
    },
    navMain,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
