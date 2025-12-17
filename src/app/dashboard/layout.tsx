"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("auth-token")

        if (!token) {
            // Redirect to login if no token
            router.push("/login")
        }
    }, [router])

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 flex flex-col">
                <DashboardHeader />
                <div className="flex-1 p-6">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
