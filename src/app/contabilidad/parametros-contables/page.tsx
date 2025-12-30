"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const CURRENCIES = ["COP", "USD", "EUR", "MXN", "PEN", "BRL", "CLP", "ARS"]

interface AccountingSettings {
  id?: string
  accountingType: "CAUSACION" | "CAJA"
  allowCash: boolean
  baseCurrency: string
  multiCurrencyEnabled: boolean
  secondaryCurrency: string | null
  decimals: number
  roundingMode: "AUTO" | "MANUAL"
  enableRoundingAdjustments: boolean
}

const DEFAULT_SETTINGS: AccountingSettings = {
  accountingType: "CAUSACION",
  allowCash: true,
  baseCurrency: "COP",
  multiCurrencyEnabled: false,
  secondaryCurrency: null,
  decimals: 2,
  roundingMode: "AUTO",
  enableRoundingAdjustments: true,
}

export default function ParametrosContablesPage() {
  const [settings, setSettings] = useState<AccountingSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth-token")
      const res = await fetch("/api/accounting-settings", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "No se pudieron cargar los parámetros")
        return
      }
      setSettings({ ...DEFAULT_SETTINGS, ...data })
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión al cargar parámetros")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      toast.loading("Guardando parámetros...", { id: "saving" })
      const token = localStorage.getItem("auth-token")
      const payload = {
        ...settings,
        decimals: String(settings.decimals),
      }
      const res = await fetch("/api/accounting-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al guardar", { id: "saving" })
        return
      }
      setSettings((prev) => ({ ...prev, ...data.settings }))
      toast.success("Parámetros guardados", { id: "saving" })
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión", { id: "saving" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Cargando parámetros...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parámetros Contables</h1>
          <p className="text-muted-foreground">Configuración general que afecta toda la contabilidad</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={saving}>Descartar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Contabilidad</CardTitle>
          <CardDescription>Define si la empresa trabaja por causación o caja</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo</Label>
            <Select value={settings.accountingType} onValueChange={(v) => setSettings({ ...settings, accountingType: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CAUSACION">Causación</SelectItem>
                <SelectItem value="CAJA">Caja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
            <Switch
              checked={settings.allowCash}
              onCheckedChange={(v) => setSettings({ ...settings, allowCash: v })}
            />
            <div>
              <Label>Permitir caja</Label>
              <p className="text-xs text-muted-foreground">Habilita registros de caja aun cuando la base sea de causación</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moneda y Multimoneda</CardTitle>
          <CardDescription>Control de moneda base y secundarias</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Moneda base</Label>
            <Select value={settings.baseCurrency} onValueChange={(v) => setSettings({ ...settings, baseCurrency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
            <Switch
              checked={settings.multiCurrencyEnabled}
              onCheckedChange={(v) => setSettings({ ...settings, multiCurrencyEnabled: v, secondaryCurrency: v ? settings.secondaryCurrency : null })}
            />
            <div>
              <Label>Habilitar multimoneda</Label>
              <p className="text-xs text-muted-foreground">Permite manejar saldos y documentos en moneda secundaria</p>
            </div>
          </div>
          <div>
            <Label>Moneda secundaria</Label>
            <Select
              value={(settings.secondaryCurrency as string | undefined) || undefined}
              onValueChange={(v) => setSettings({ ...settings, secondaryCurrency: v })}
              disabled={!settings.multiCurrencyEnabled}
            >
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.filter((c) => c !== settings.baseCurrency).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Debe ser distinta a la moneda base</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decimales y Redondeo</CardTitle>
          <CardDescription>Controla precisión y ajuste de importes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Decimales contables</Label>
            <Select value={String(settings.decimals)} onValueChange={(v) => setSettings({ ...settings, decimals: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Redondeo</Label>
            <Select value={settings.roundingMode} onValueChange={(v) => setSettings({ ...settings, roundingMode: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Automático</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
            <Switch
              checked={settings.enableRoundingAdjustments}
              onCheckedChange={(v) => setSettings({ ...settings, enableRoundingAdjustments: v })}
            />
            <div>
              <Label>Ajustes por redondeo</Label>
              <p className="text-xs text-muted-foreground">Permite registrar diferencias por redondeo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Removed naturaleza por defecto: se configura a nivel de cuentas contables */}
    </div>
  )
}
