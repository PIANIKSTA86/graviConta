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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { VoucherTypeDialog } from "@/components/voucher-types/VoucherTypeDialog"
import { Plus, Search, Edit, Trash2 } from "lucide-react"

interface VoucherType {
  id: string
  code: string
  name: string
  prefix?: string | null
  currentConsecutive: number
  isActive: boolean
}

export default function VoucherTypesPage() {
  const router = useRouter()
  const [items, setItems] = useState<VoucherType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<VoucherType | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ACTIVE")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      router.push("/login")
    } else {
      load()
    }
  }, [router, search, status, page, limit])

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth-token")
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search.trim()) params.append("search", search.trim())
      if (status) params.append("status", status)
      const res = await fetch(`/api/voucher-types?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setItems(data.voucherTypes || [])
      if (data.pagination) { setTotal(data.pagination.total); setPages(data.pagination.pages) }
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  const handleCreate = () => { setSelected(null); setDialogOpen(true) }
  const handleEdit = (item: VoucherType) => { setSelected(item); setDialogOpen(true) }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("auth-token")
    const res = await fetch(`/api/voucher-types/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || "No se pudo eliminar")
      return
    }
    load()
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
                <h1 className="text-3xl font-bold">Tipos de Comprobantes</h1>
                <p className="text-muted-foreground">Configura códigos, prefijos y consecutivos por tipo.</p>
              </div>
              <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Tipo</Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[260px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Buscar por código o nombre" className="pl-10" />
                  </div>
                  <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v) }}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activos</SelectItem>
                      <SelectItem value="INACTIVE">Inactivos</SelectItem>
                      <SelectItem value="ALL">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(Number(v)) }}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="Filas" /></SelectTrigger>
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

            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-12 text-muted-foreground">Cargando...</div>
                ) : items.length === 0 ? (
                  <div className="text-muted-foreground">Sin tipos configurados</div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Prefijo</TableHead>
                            <TableHead>Consecutivo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell className="font-medium">{it.code}</TableCell>
                              <TableCell>{it.name}</TableCell>
                              <TableCell>{it.prefix || ""}</TableCell>
                              <TableCell>{it.currentConsecutive}</TableCell>
                              <TableCell>
                                {it.isActive ? (
                                  <Badge variant="outline" className="text-xs">Activo</Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(it)}><Edit className="h-3 w-3 mr-1" />Editar</Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDelete(it.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-muted-foreground">Mostrando {startIdx}-{endIdx} de {total}</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
                        <div className="text-sm text-muted-foreground">Página {page} de {pages}</div>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Siguiente</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <VoucherTypeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={load} voucherType={selected} />
    </SidebarProvider>
  )
}
