"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsuariosPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Usuarios</h1>
              <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                  Administra los usuarios y sus permisos en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Funcionalidad en desarrollo. Próximamente podrás gestionar usuarios.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}