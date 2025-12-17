"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlanCuentasPage() {
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
              <h1 className="text-3xl font-bold">Plan de Cuentas</h1>
              <p className="text-muted-foreground">Gestión del Plan Único de Cuentas (PUC)</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Plan de Cuentas</CardTitle>
                <CardDescription>
                  Aquí podrás gestionar todas las cuentas contables según el PUC colombiano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Funcionalidad en desarrollo. Próximamente podrás crear, editar y gestionar cuentas contables.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}