"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, FileText, FolderTree, Plus, Search, Edit, RefreshCw, AlertCircle, Trash2, Ban } from "lucide-react"
import { AccountDialog } from "@/components/plan-cuentas/AccountDialog"
import { AccountValidationDialog } from "@/components/plan-cuentas/AccountValidationDialog"
import { AccountDeleteDialog } from "@/components/plan-cuentas/AccountDeleteDialog"

type AccountNode = {
  id: string
  code: string
  name: string
  level: number
  nature: string
  accountType: string
  isAuxiliary: boolean
  allowsMovement: boolean
  parentCode: string | null
  hasChildren: boolean
}

async function fetchNodes(parentCode: string | null, token: string): Promise<AccountNode[]> {
  const url = parentCode ? `/api/accounts/tree?parentCode=${encodeURIComponent(parentCode)}` : `/api/accounts/tree`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('No se pudieron cargar las cuentas')
  const data = await res.json()
  return data.nodes as AccountNode[]
}

async function searchAccounts(query: string, token: string): Promise<AccountNode[]> {
  const res = await fetch(`/api/accounts/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Error en búsqueda')
  const data = await res.json()
  return data.accounts as AccountNode[]
}

function TreeItem({ node, token, onEdit, onValidate, onDelete }: { node: AccountNode; token: string; onEdit: (node: AccountNode) => void; onValidate: (node: AccountNode) => void; onDelete: (node: AccountNode) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState<AccountNode[] | null>(null)

  const indent = useMemo(() => Math.max(0, (node.level - 1) * 16), [node.level])

  const onToggle = useCallback(async () => {
    if (!node.hasChildren) return
    const next = !expanded
    setExpanded(next)
    if (next && children == null) {
      try {
        setLoading(true)
        const nodes = await fetchNodes(node.code, token)
        setChildren(nodes)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }, [expanded, children, node, token])

  return (
    <div>
      <div className="flex items-center py-1.5 select-none group" style={{ marginLeft: indent }}>
        {node.hasChildren ? (
          <button
            onClick={onToggle}
            className="mr-2 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted"
            aria-label={expanded ? 'Colapsar' : 'Expandir'}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="mr-2 h-6 w-6 inline-flex items-center justify-center" />
        )}
        {node.hasChildren ? (
          <FolderTree className="h-4 w-4 text-primary mr-2" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground mr-2" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{node.code}</span>
            <span className="truncate">{node.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {node.accountType} · {node.nature} {node.isAuxiliary ? '· Auxiliar' : ''}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(node)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        {node.isAuxiliary && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onValidate(node)}
            title="Validar reglas"
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(node)}
          title="Desactivar o eliminar"
        >
          <Ban className="h-4 w-4" />
        </Button>
      </div>
      {expanded && (
        <div className="ml-0">
          {loading && <div className="pl-10 text-xs text-muted-foreground">Cargando...</div>}
          {!loading && children && children.map((child) => (
            <TreeItem key={child.id} node={child} token={token} onEdit={onEdit} onValidate={onValidate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PlanCuentasPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [roots, setRoots] = useState<AccountNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AccountNode[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountNode | null>(null)
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [validationAccountId, setValidationAccountId] = useState("")
  const [validationAccountCode, setValidationAccountCode] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState<AccountNode | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      router.push("/login")
    }
    setToken(token)
    async function load() {
      if (!token) return
      try {
        setLoading(true)
        const nodes = await fetchNodes(null, token)
        setRoots(nodes)
      } catch (e: any) {
        setError(e?.message ?? 'Error cargando cuentas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleSearch = async () => {
    if (!token || !searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    try {
      setSearching(true)
      const results = await searchAccounts(searchQuery, token)
      setSearchResults(results)
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  const handleRefresh = async () => {
    if (!token) return
    try {
      setLoading(true)
      setSearchQuery("")
      setSearchResults(null)
      const nodes = await fetchNodes(null, token)
      setRoots(nodes)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingAccount(null)
    setDialogOpen(true)
  }

  const handleEdit = (node: AccountNode) => {
    setEditingAccount(node)
    setDialogOpen(true)
  }

  const handleValidate = (node: AccountNode) => {
    setValidationAccountId(node.id)
    setValidationAccountCode(node.code)
    setValidationDialogOpen(true)
  }

  const handleDelete = (node: AccountNode) => {
    setDeletingAccount(node)
    setDeleteDialogOpen(true)
  }

  const handleSave = () => {
    handleRefresh()
  }

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
                  Visualiza el PUC de tu empresa de forma jerárquica con carga bajo demanda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código o nombre..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                      }}
                    />
                  </div>
                  <Button variant="outline" onClick={handleSearch} disabled={searching}>
                    {searching ? 'Buscando...' : 'Buscar'}
                  </Button>
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cuenta
                  </Button>
                </div>
                {error && (
                  <div className="text-sm text-red-600 mb-2">{error}</div>
                )}
                {loading && (
                  <div className="text-sm text-muted-foreground">Cargando plan de cuentas...</div>
                )}
                {!loading && token && (
                  <div className="border rounded-md divide-y max-h-[600px] overflow-y-auto">
                    {searchResults ? (
                      searchResults.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">No se encontraron resultados.</div>
                      ) : (
                        searchResults.map((n) => (
                          <div key={n.id} className="flex items-center py-2 px-3 hover:bg-muted group">
                            <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">{n.code}</span>
                                <span className="truncate">{n.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {n.accountType} · {n.nature} {n.isAuxiliary ? '· Auxiliar' : ''}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleEdit(n)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )
                    ) : roots.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No hay cuentas registradas.</div>
                    ) : (
                      roots.map((n) => <TreeItem key={n.id} node={n} token={token} onEdit={handleEdit} onValidate={handleValidate} onDelete={handleDelete} />)
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        account={editingAccount}
        token={token || ""}
      />
      <AccountValidationDialog
        open={validationDialogOpen}
        onOpenChange={setValidationDialogOpen}
        accountId={validationAccountId}
        accountCode={validationAccountCode}
        token={token || ""}
      />
      <AccountDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleSave}
        account={deletingAccount}
        token={token || ""}
      />
    </SidebarProvider>
  )
}