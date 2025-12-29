"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface VoucherType {
  id?: string
  code: string
  name: string
  prefix?: string | null
  currentConsecutive?: number
  isActive?: boolean
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  voucherType?: VoucherType | null
}

export function VoucherTypeDialog({ open, onOpenChange, onSuccess, voucherType }: Props) {
  const [form, setForm] = useState<VoucherType>({
    code: voucherType?.code || "",
    name: voucherType?.name || "",
    prefix: voucherType?.prefix || "",
    isActive: voucherType?.isActive ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("auth-token")
      const url = voucherType?.id ? `/api/voucher-types/${voucherType.id}` : "/api/voucher-types"
      const method = voucherType?.id ? "PUT" : "POST"
      const payload = {
        code: form.code,
        name: form.name,
        prefix: form.prefix || undefined,
        isActive: form.isActive,
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar el tipo")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{voucherType ? "Editar Tipo de Comprobante" : "Nuevo Tipo de Comprobante"}</DialogTitle>
          <DialogDescription>Configura el código, nombre, prefijo y estado.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código*</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!voucherType} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre*</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prefix">Prefijo</Label>
            <Input id="prefix" value={form.prefix || ""} onChange={(e) => setForm({ ...form, prefix: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: !!v })} />
            <label htmlFor="isActive" className="text-sm">Activo</label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : voucherType ? "Actualizar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
