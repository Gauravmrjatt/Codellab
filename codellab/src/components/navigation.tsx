"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Code2, Users, Trophy, Plus, LayoutDashboard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navigation() {
  return (
    <header className="sticky bg-card top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-16  items-center px-4 sm:px-6 lg:px-8 relative">

        {/* LEFT: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          <span className="text-xl font-bold">CodeLab</span>
        </Link>

        {/* CENTER: Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex items-center gap-6">
          <Link
            href="/rooms"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            Rooms
          </Link>

          <Link
            href="/contests"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy className="h-4 w-4" />
            Contests
          </Link>

          <Link
            href="/problems"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code2 className="h-4 w-4" />
            Problems
          </Link>
        </nav>

        {/* RIGHT: Actions */}
        <div className="ml-auto flex items-center gap-3">
     
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="User avatar" />
                  <AvatarFallback>UN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  )
}
