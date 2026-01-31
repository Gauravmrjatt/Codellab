import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="">
      <Navigation />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  )
}