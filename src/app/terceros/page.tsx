"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ThirdPartyDialog } from "@/components/terceros/ThirdPartyDialog"
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
  AlertCircle
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
  CUSTOMER: 'Cliente',
  SUPPLIER: 'Proveedor',
  EMPLOYEE: 'Empleado',
  BOTH: 'Cliente/Proveedor',
}

const TYPE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SUPPLIER: 'bg-green-500/10 text-green-500 border-green-500/20',
  EMPLOYEE: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  BOTH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

const REGIME_LABELS: Record<string, string> = {
  COMUN: 'Común',
  SIMPLIFICADO: 'Simplificado',
  GRAN_CONTRIBUYENTE: 'Gran Contribuyente',
}

export default function TercerosPage() {
  const router = useRouter()
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedThirdParty, setSelectedThirdParty] = useState<ThirdParty | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [thirdPartyToDelete, setThirdPartyToDelete] = useState<string | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      router.push("/login")
    } else {
      loadThirdParties()
    }
  }, [router, typeFilter])

  const loadThirdParties = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      
      const params = new URLSearchParams({
        limit: '1000',
      })
      
      if (typeFilter !== 'ALL') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`/api/third-parties?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al cargar terceros')
      }

      const data = await response.json()
      setThirdParties(data.thirdParties || [])
    } catch (error) {
      console.error('Error cargando terceros:', error)
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
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/third-parties/${thirdPartyToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al eliminar el tercero')
        return
      }

      await loadThirdParties()
      setDeleteDialogOpen(false)
      setThirdPartyToDelete(null)
    } catch (error) {
      console.error('Error eliminando tercero:', error)
      alert('Error al eliminar el tercero')
    }
  }

  const filteredThirdParties = thirdParties.filter((tp) => {
    const matchesSearch = 
      tp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tp.identificationNumber.includes(searchTerm) ||
      tp.commercialName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

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
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, identificación..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                </div>
              </CardContent>
            </Card>

            {/* Lista de Terceros */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Cargando terceros...</div>
              </div>
            ) : filteredThirdParties.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No hay terceros registrados</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comienza creando tu primer tercero
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Tercero
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredThirdParties.map((thirdParty) => (
                  <Card key={thirdParty.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{thirdParty.name}</CardTitle>
                          {thirdParty.commercialName && (
                            <p className="text-sm text-muted-foreground truncate">
                              {thirdParty.commercialName}
                            </p>
                          )}
                        </div>
                        <Badge className={`ml-2 ${TYPE_COLORS[thirdParty.type]}`}>
                          {TYPE_LABELS[thirdParty.type]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {thirdParty.identificationType}: {thirdParty.identificationNumber}
                          </span>
                        </div>
                        
                        {thirdParty.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground truncate">{thirdParty.email}</span>
                          </div>
                        )}
                        
                        {thirdParty.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{thirdParty.phone}</span>
                          </div>
                        )}
                        
                        {thirdParty.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {thirdParty.city}{thirdParty.department ? `, ${thirdParty.department}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="text-xs">
                          {REGIME_LABELS[thirdParty.taxRegime]}
                        </Badge>
                        {thirdParty.isAutoRetainer && (
                          <Badge variant="outline" className="text-xs">
                            Autoretenedor
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(thirdParty)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(thirdParty.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
              <AlertCircle className="h-5 w-5 text-destructive" />
              ¿Eliminar Tercero?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tercero será eliminado permanentemente.
              {'\n\n'}
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