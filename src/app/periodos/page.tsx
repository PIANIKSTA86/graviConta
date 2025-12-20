"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Lock, LockOpen, Trash2, RefreshCw } from "lucide-react"
import { PeriodDialog } from "@/components/periods/PeriodDialog"

type Period = {
  id: string
  year: number
  month: number
  status: 'OPEN' | 'CLOSED' | 'LOCKED'
  openingDate: string
  closingDate: string | null
  createdAt: string
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const statusColors = {
  OPEN: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-orange-100 text-orange-800 border-orange-200',
  LOCKED: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  LOCKED: 'Bloqueado',
}

export default function PeriodosPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      router.push("/login")
      return
    }
    setToken(token)
    loadPeriods(token)
  }, [router])

  const loadPeriods = async (authToken: string) => {
    try {
      setLoading(true)
      const res = await fetch('/api/periods', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Error cargando períodos')
      const data = await res.json()
      setPeriods(data.periods || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeStatus = async (period: Period, newStatus: 'OPEN' | 'CLOSED' | 'LOCKED') => {
    if (!token) return
    try {
      const res = await fetch(`/api/periods/${period.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          closingDate: newStatus !== 'OPEN' ? new Date().toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error('Error actualizando período')
      await loadPeriods(token)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDelete = async (period: Period) => {
    if (!token) return
    if (!confirm(`¿Eliminar período ${monthNames[period.month - 1]} ${period.year}?`)) return

    try {
      const res = await fetch(`/api/periods/${period.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Error eliminando período')
        return
      }
      await loadPeriods(token)
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Períodos Contables</h1>
                <p className="text-muted-foreground">Administra los períodos contables de tu empresa</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => token && loadPeriods(token)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Período
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Períodos Registrados</CardTitle>
                <CardDescription>
                  Gestiona el estado de los períodos contables: Abierto, Cerrado o Bloqueado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando períodos...</div>
                ) : periods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay períodos registrados. Crea el primer período para comenzar.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {periods.map((period) => (
                      <Card key={period.id} className="relative">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{monthNames[period.month - 1]}</CardTitle>
                              <CardDescription className="text-2xl font-bold">{period.year}</CardDescription>
                            </div>
                            <Badge className={statusColors[period.status]} variant="outline">
                              {statusLabels[period.status]}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Apertura: {new Date(period.openingDate).toLocaleDateString()}</span>
                            </div>
                            {period.closingDate && (
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>Cierre: {new Date(period.closingDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {period.status === 'OPEN' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChangeStatus(period, 'CLOSED')}
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                Cerrar
                              </Button>
                            )}
                            {period.status === 'CLOSED' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChangeStatus(period, 'OPEN')}
                                >
                                  <LockOpen className="h-3 w-3 mr-1" />
                                  Reabrir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChangeStatus(period, 'LOCKED')}
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  Bloquear
                                </Button>
                              </>
                            )}
                            {period.status !== 'LOCKED' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(period)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PeriodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={() => token && loadPeriods(token)}
        token={token || ""}
      />
    </SidebarProvider>
  )
}