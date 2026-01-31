"use client"

import * as React from "react"
import Link from "next/link"
import { useScroll, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Code2, Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle
} from "@/components/ui/sheet"

export function LandingNavigation() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { scrollY } = useScroll()
  
  // Update scrolled state for conditional styling logic if needed, 
  // though motion values handle animations directly.
  React.useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])
  
  // Using simple classes for now as raw CSS vars might be tricky with motion values if not set up
  // relying on standard Tailwind classes with conditional logic for clarity

  return (
    <motion.header
      className={`fixed top-0 z-50 px-20 w-full border-b transition-all duration-300 ${
        isScrolled 
          ? "border-border/40 bg-background/80 backdrop-blur-md shadow-sm" 
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 z-50">
          <div className="p-1.5 rounded-lg bg-[#edae00]/10 border border-[#edae00]/20">
             <Code2 className="h-5 w-5 text-[#edae00]" />
          </div>
          <span className="text-xl font-bold tracking-tight">CodeLab</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            ["Features", "#features"],
            ["How it Works", "#how-it-works"],
            ["Contests", "/contests"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-muted-foreground hover:text-[#edae00] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          
          <Link href="/login">
            <Button variant="ghost" className="hover:text-[#edae00] hover:bg-[#edae00]/10">
              Log in
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button className="bg-[#edae00] text-black hover:bg-[#d49b00] font-semibold">
              Get Started
            </Button>
          </Link>
        </div>

        {/* MOBILE MENU */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="text-left flex items-center gap-2 mb-6">
                 <div className="p-1.5 rounded-lg bg-[#edae00]/10 border border-[#edae00]/20">
                   <Code2 className="h-5 w-5 text-[#edae00]" />
                 </div>
                 CodeLab
              </SheetTitle>
              <nav className="flex flex-col gap-4">
                {[
                  ["Features", "#features"],
                  ["How it Works", "#how-it-works"],
                  ["Contests", "/contest"],
                ].map(([label, href]) => (
                  <SheetClose asChild key={label}>
                    <Link
                      href={href}
                      className="block px-2 py-1 text-lg font-medium hover:text-[#edae00] transition-colors"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="my-4 h-px bg-border" />
                <SheetClose asChild>
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-start">
                      Log in
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/dashboard">
                    <Button className="w-full bg-[#edae00] text-black hover:bg-[#d49b00]">
                      Get Started
                    </Button>
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </motion.header>
  )
}
