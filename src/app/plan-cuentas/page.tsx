"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, FileText, FolderTree } from "lucide-react"

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

function TreeItem({ node, token }: { node: AccountNode; token: string }) {
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
      <div className="flex items-center py-1.5 select-none" style={{ marginLeft: indent }}>
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
      </div>
      {expanded && (
        <div className="ml-0">
          {loading && <div className="pl-10 text-xs text-muted-foreground">Cargando...</div>}
          {!loading && children && children.map((child) => (
            <TreeItem key={child.id} node={child} token={token} />
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
                {error && (
                  <div className="text-sm text-red-600 mb-2">{error}</div>
                )}
                {loading && (
                  <div className="text-sm text-muted-foreground">Cargando plan de cuentas...</div>
                )}
                {!loading && token && (
                  <div className="border rounded-md divide-y">
                    {roots.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No hay cuentas registradas.</div>
                    ) : (
                      roots.map((n) => <TreeItem key={n.id} node={n} token={token} />)
                    )}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!token) return
                      try {
                        setLoading(true)
                        const nodes = await fetchNodes(null, token)
                        setRoots(nodes)
                      } finally {
                        setLoading(false)
                      }
                    }}
                  >
                    Refrescar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}