"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Trophy,
    Code2,
    Settings,
    User,
    History,
    Shield,
    Users
} from "lucide-react";
import { useSession } from "next-auth/react";

const defaultSidebarItems = [
    {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard
    },
    {
        title: "My Rooms",
        href: "/dashboard/rooms",
        icon: Users
    },
    {
        title: "My Contests",
        href: "/dashboard/contests",
        icon: Trophy
    },
    {
        title: "My Problems",
        href: "/dashboard/problems",
        icon: Code2
    },
    {
        title: "Submission History",
        href: "/dashboard/submissions",
        icon: History
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: User
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings
    }
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    
    // Conditionally add admin item if user is admin
    const sidebarItems = session?.user?.role === "ADMIN" 
        ? [
            ...defaultSidebarItems,
            {
                title: "Admin Panel",
                href: "/dashboard/admin",
                icon: Shield
            }
        ]
        : defaultSidebarItems;

    return (
        <div className="flex flex-col w-64 border-r bg-card h-[calc(100vh-4rem)]">
            <div className="flex-1 py-6 space-y-1 px-3">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t">
                <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">PRO PLAN</p>
                    <p className="text-xs text-muted-foreground mb-3">Upgrade for unlimited private rooms and advanced analytics.</p>
                    <button className="w-full text-xs bg-primary text-primary-foreground py-1.5 rounded-md hover:opacity-90 transition-opacity">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    )
}