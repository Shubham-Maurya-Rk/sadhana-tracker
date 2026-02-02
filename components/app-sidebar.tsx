"use client"

import * as React from "react"
import {
  BookOpen,
  BookOpenText,
  BookOpenTextIcon,
  Bot,
  ChartNoAxesColumn,
  Compass,
  Flame,
  Flower,
  Frame,
  GraduationCap,
  Home,
  LayoutDashboard,
  Map,
  MessageCircle,
  PieChart,
  RefreshCcwIcon,
  Settings2,
  SquareTerminal,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserStarIcon,
} from "lucide-react"

import { AuthButtons, LogoutButton, NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"


// This is sample data.
const data = {
  superadmin: [
    {
      name: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard, // More modern than 'Home'
    },
    {
      name: "Mentor Verifications",
      url: "/admin/mentor-verifications",
      icon: UserCheck, // Reflects the "Verification/Approval" aspect
    },
    {
      name: "Japa Motivation",
      url: "/admin/motivations",
      icon: Flame, // Represents inspiration/fire or spiritual drive
    },
    {
      name: "Shlokas",
      url: "/admin/shlokas",
      icon: BookOpenText, // Represents scriptures and reading
    }
  ],
  sections: [
    {
      name: "Home",
      url: "/",
      icon: Home,
    },
    {
      name: "Motivation",
      url: "/#sadhana-motivation",
      icon: Frame,
    },
    {
      name: "About App",
      url: "/#about-app",
      icon: PieChart,
    },
    {
      name: "Shlokas",
      url: "/#shlokas",
      icon: Map,
    },
  ],
  tracker: [
    {
      name: "Your Sadhana",
      url: "/sadhak",
      icon: Flower,
    },
    {
      name: "Book Tracker",
      url: "/books",
      icon: BookOpenTextIcon,
    },
    {
      name: "Shloka Track",
      url: "/challenges",
      icon: ChartNoAxesColumn,
    },
    {
      name: "Mentors",
      url: "/mentors",
      icon: GraduationCap,
    },
    {
      name: "Friends",
      url: "/friends",
      icon: UserStarIcon,
    },
    {
      name: "Chats",
      url: "/chats",
      icon: MessageCircle,
    }
  ],
  mentorSections: [
    { name: "Groups", url: "/mentor/groups", icon: Users },
    { name: "Requests", url: "/mentor/requests", icon: UserPlus },
    { name: "Reset Streaks", url: "/api/cron/reset-streaks", icon: Compass },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()
  const role = session?.user?.role;
  useEffect(() => {
    setMounted(true)
  }, [])
  const dynamicUser = {
    name: session?.user?.name ?? "Guest",
    email: session?.user?.email ?? "",
    avatar: session?.user?.profileImage ?? "", // Next-Auth uses 'image', Shadcn uses 'avatar'
  }

  // Prevent rendering on the server to avoid ID mismatches
  if (!mounted) {
    return <div className="w-[--sidebar-width]" /> // Return a placeholder with the same width
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={data.sections} title="Sections" />
        {
          status === "authenticated" && role === "SUPERADMIN" && (<NavProjects projects={data.superadmin} title="Superadmin" />)
        }
        {
          status === "authenticated" && <NavProjects projects={data.tracker} title="Tracker" />
        }
        {
          status === "authenticated" && role === "MENTOR" && (<NavProjects projects={data.mentorSections} title="Mentor" />)
        }
        {
          status === "unauthenticated" && <AuthButtons />
        }
      </SidebarContent>
      {
        status === "authenticated" && <SidebarFooter>
          <NavUser user={dynamicUser} />
        </SidebarFooter>
      }
      <SidebarRail />
    </Sidebar>
  )
}
