"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ThirdPartyDialog } from "@/components/terceros/ThirdPartyDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ThirdParty {
  id: string
  identificationType: string
  identificationNumber: string
  name: string
  commercialName?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  city?: string | null
  department?: string | null
  type: string
  taxRegime: string
  isAutoRetainer: boolean
  fiscalResponsibilities: string
  isActive: boolean
}

const TYPE_LABELS: Record<string, string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Proveedor",
  EMPLOYEE: "Empleado",
  BOTH: "Cliente/Proveedor",
}

const REGIME_LABELS: Record<string, string> = {
  COMUN: "Común",
  SIMPLIFICADO: "Simplificado",
  GRAN_CONTRIBUYENTE: "Gran Contribuyente",
}

export default function TercerosPage() {
  const router = useRouter()
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedThirdParty, setSelectedThirdParty] = useState<ThirdParty | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [thirdPartyToDelete, setThirdPartyToDelete] = useState<string | null>(null)

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      router.push("/login")
    } else {
      loadThirdParties()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, typeFilter, page, limit, searchTerm])

  const loadThirdParties = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth-token")

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })

      if (typeFilter !== "ALL") {
        params.append("type", typeFilter)
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim())
      }

      const response = await fetch(`/api/third-parties?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar terceros")
      }

      const data = await response.json()
      setThirdParties(data.thirdParties || [])
      if (data.pagination) {
        setTotal(data.pagination.total || 0)
        setPages(data.pagination.pages || 1)
      } else {
        setTotal(data.thirdParties?.length || 0)
        setPages(1)
      }
    } catch (error) {
      console.error("Error cargando terceros:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (thirdParty: ThirdParty) => {
    setSelectedThirdParty(thirdParty)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedThirdParty(null)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setThirdPartyToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!thirdPartyToDelete) return

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/third-parties/${thirdPartyToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Error al eliminar el tercero")
        return
      }

      await loadThirdParties()
      setDeleteDialogOpen(false)
      setThirdPartyToDelete(null)
    } catch (error) {
      console.error("Error eliminando tercero:", error)
      alert("Error al eliminar el tercero")
    }
  }

  const startIdx = (page - 1) * limit + 1
  const endIdx = Math.min(page * limit, total)

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Terceros</h1>
                <p className="text-muted-foreground">Gestión de clientes, proveedores y empleados</p>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Tercero
              </Button>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[260px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, identificación..."
                      value={searchTerm}
                      onChange={(e) => {
                        setPage(1)
                        setSearchTerm(e.target.value)
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={typeFilter}
                    onValueChange={(val) => {
                      setPage(1)
                      setTypeFilter(val)
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="CUSTOMER">Clientes</SelectItem>
                      <SelectItem value="SUPPLIER">Proveedores</SelectItem>
                      <SelectItem value="EMPLOYEE">Empleados</SelectItem>
                      <SelectItem value="BOTH">Cliente/Proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(Number(v)) }}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Filas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Terceros */}
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-12 text-muted-foreground">Cargando terceros...</div>
                ) : thirdParties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No hay terceros registrados</p>
                    <p className="text-sm text-muted-foreground mb-4">Comienza creando tu primer tercero</p>
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primer Tercero
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="whitespace-nowrap">Identificación</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Régimen</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {thirdParties.map((tp) => (
                            <TableRow key={tp.id}>
                              <TableCell className="max-w-[260px]">
                                <div className="font-medium truncate">{tp.name}</div>
                                {tp.commercialName && (
                                  <div className="text-xs text-muted-foreground truncate">{tp.commercialName}</div>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building2 className="h-4 w-4" />
                                  {tp.identificationType}: {tp.identificationNumber}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {TYPE_LABELS[tp.type]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{REGIME_LABELS[tp.taxRegime]}</Badge>
                              </TableCell>
                              <TableCell className="max-w-[220px]">
                                {tp.email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                                    <Mail className="h-4 w-4" />
                                    {tp.email}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {tp.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    {tp.phone}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                {(tp.city || tp.department) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                                    <MapPin className="h-4 w-4" />
                                    {tp.city}{tp.department ? `, ${tp.department}` : ""}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {tp.isAutoRetainer && (
                                    <Badge variant="outline" className="text-xs">Autoretenedor</Badge>
                                  )}
                                  {tp.isActive ? (
                                    <Badge variant="outline" className="text-xs">Activo</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(tp)}>
                                    <Edit className="h-3 w-3 mr-1" /> Editar
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDeleteClick(tp.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {startIdx}-{endIdx} de {total}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          Página {page} de {pages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(pages, p + 1))}
                          disabled={page >= pages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ThirdPartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadThirdParties}
        thirdParty={selectedThirdParty}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" /> ¿Eliminar Tercero?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tercero será eliminado permanentemente.
              {"\n\n"}
              Solo puedes eliminar terceros que no tengan transacciones, facturas o documentos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
