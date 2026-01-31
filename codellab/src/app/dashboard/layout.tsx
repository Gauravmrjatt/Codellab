import { Navigation } from "@/components/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Navigation />
            <div className="flex flex-1">
                <DashboardSidebar />
                <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
