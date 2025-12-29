"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface UserItem {
  id: string
  name: string
  email: string
  role: "ADMIN" | "ACCOUNTANT" | "MANAGER" | "USER"
  isActive: boolean
  lastLogin?: string | null
  createdAt: string
}

export default function UsuariosPage() {
  const [items, setItems] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ACTIVE")
  const [role, setRole] = useState("ALL")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  // Dialog form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [userRole, setUserRole] = useState<"ADMIN"|"ACCOUNTANT"|"MANAGER"|"USER">("USER")
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState("")

  useEffect(() => {
    load()
  }, [search, status, role, page, limit])

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth-token")
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search.trim()) params.append("search", search.trim())
      if (status) params.append("status", status)
      if (role && role !== 'ALL') params.append("role", role)
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setItems(data.users || [])
      if (data.pagination) { setTotal(data.pagination.total); setPages(data.pagination.pages) }
    } catch (e) {
      console.error(e)
      toast.error("Error al cargar usuarios")
    } finally { setLoading(false) }
  }

  const openCreate = () => {
    setSelected(null)
    setName("")
    setEmail("")
    setUserRole("USER")
    setIsActive(true)
    setPassword("")
    setDialogOpen(true)
  }

  const openEdit = (u: UserItem) => {
    setSelected(u)
    setName(u.name)
    setEmail(u.email)
    setUserRole(u.role)
    setIsActive(u.isActive)
    setPassword("")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const isEdit = Boolean(selected)
      const payload: any = { name, email, role: userRole, isActive }
      if (!isEdit && !password.trim()) {
        toast.error("Contraseña requerida para nuevo usuario")
        return
      }
      if (!isEdit && password.trim()) payload.password = password.trim()
      if (isEdit && password.trim()) payload.password = password.trim()

      toast.loading(isEdit ? "Actualizando usuario..." : "Creando usuario...", { id: "saving" })

      const res = await fetch(isEdit ? `/api/users/${selected!.id}` : "/api/users", {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Operación fallida", { id: "saving" })
        return
      }
      toast.success(isEdit ? "Usuario actualizado" : "Usuario creado", { id: "saving" })
      setDialogOpen(false)
      load()
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión", { id: "saving" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!confirm("¿Desactivar este usuario?")) return
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "No se pudo desactivar")
        return
      }
      toast.success("Usuario desactivado")
      load()
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión")
    }
  }

  const startIdx = (page - 1) * limit + 1
  const endIdx = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        <Button onClick={openCreate}>Nuevo Usuario</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Buscar por nombre o email" className="flex-1 min-w-[260px]" />
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v) }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
                <SelectItem value="ALL">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(v) => { setPage(1); setRole(v) }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ACCOUNTANT">Contador</SelectItem>
                <SelectItem value="MANAGER">Gestor</SelectItem>
                <SelectItem value="USER">Usuario</SelectItem>
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
            <div className="text-muted-foreground">Sin usuarios</div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge variant="outline" className="text-xs">Activo</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(u)}>Editar</Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(u.id)}>Desactivar</Button>
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

      {/* Dialogo Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <CardDescription>{selected ? 'Actualiza los datos del usuario' : 'Registra un nuevo usuario'}</CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Rol</Label>
                <Select value={userRole} onValueChange={(v) => setUserRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="ACCOUNTANT">Contador</SelectItem>
                    <SelectItem value="MANAGER">Gestor</SelectItem>
                    <SelectItem value="USER">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setIsActive(v === 'true')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{selected ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{selected ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}