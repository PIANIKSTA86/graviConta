"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Trash2, Ban } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  account: {
    id: string
    code: string
    name: string
  } | null
  token: string
}

export function AccountDeleteDialog({ open, onOpenChange, onSuccess, account, token }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<"disable" | "delete">("disable")

  if (!account) return null

  const handleConfirm = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: action === "delete" ? "hard-delete" : "soft-delete" }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Si hay movimientos asociados
        if (data.hasMovements) {
          setError(
            action === "delete"
              ? "No se puede eliminar la cuenta porque tiene movimientos asociados. Por favor desactívela en su lugar."
              : "No se puede desactivar la cuenta porque tiene movimientos asociados."
          )
        } else {
          setError(data.error || "Error al procesar la solicitud")
        }
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch (e) {
      setError("Error al procesar la solicitud")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Cuenta</DialogTitle>
          <DialogDescription>
            {account.code} - {account.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={action} onValueChange={(v) => setAction(v as "disable" | "delete")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disable" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Desactivar
            </TabsTrigger>
            <TabsTrigger value="delete" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disable" className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Desactivar Cuenta</AlertTitle>
              <AlertDescription className="text-blue-800">
                La cuenta será marcada como inactiva y no podrá usarse en nuevos movimientos, pero los datos se conservarán.
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Requisito</AlertTitle>
              <AlertDescription className="text-yellow-800">
                La cuenta no debe tener movimientos o saldos activos.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Eliminar Permanentemente</AlertTitle>
              <AlertDescription className="text-red-800">
                Esta acción es irreversible. La cuenta y todos sus datos serán eliminados de forma permanente.
              </AlertDescription>
            </Alert>

            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Requisito Importante</AlertTitle>
              <AlertDescription className="text-red-800">
                La cuenta no debe tener movimientos o saldos asociados. Si tiene movimientos, debe desactivarla en su lugar.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={action === "delete" ? "destructive" : "secondary"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : action === "delete" ? "Eliminar Permanentemente" : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
