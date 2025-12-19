"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Search } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  account?: AccountNode | null
  token: string
}

export function AccountDialog({ open, onOpenChange, onSave, account, token }: Props) {
  const isEdit = !!account
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [nature, setNature] = useState("DEUDORA")
  const [accountType, setAccountType] = useState("ACTIVO")
  const [parentCode, setParentCode] = useState("")
  const [isTemplate, setIsTemplate] = useState(false)
  const [requiresCostCenter, setRequiresCostCenter] = useState(false)
  const [appliesWithholding, setAppliesWithholding] = useState(false)
  const [appliesTaxes, setAppliesTaxes] = useState(false)
  const [niifCode, setNiifCode] = useState("")
  const [closingAccountCode, setClosingAccountCode] = useState("")
  const [closingAccountOptions, setClosingAccountOptions] = useState<Array<{ code: string; name: string }>>([])
  const [closingAccountOpen, setClosingAccountOpen] = useState(false)
  const [closingAccountSearch, setClosingAccountSearch] = useState("")

  useEffect(() => {
    if (account) {
      setCode(account.code)
      setName(account.name)
      setNature(account.nature)
      setAccountType(account.accountType)
      setParentCode(account.parentCode || "")
      // Optional fields - set defaults on edit if provided via account
    } else {
      setCode("")
      setName("")
      setNature("DEUDORA")
      setAccountType("ACTIVO")
      setParentCode("")
      setIsTemplate(false)
      setRequiresCostCenter(false)
      setAppliesWithholding(false)
      setAppliesTaxes(false)
      setNiifCode("")
      setClosingAccountCode("")
      setClosingAccountSearch("")
    }
  }, [account, open])

  const handleSearchClosingAccount = async (query: string) => {
    setClosingAccountSearch(query)
    if (!token || !query.trim()) {
      setClosingAccountOptions([])
      return
    }
    try {
      const res = await fetch(`/api/accounts/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setClosingAccountOptions((data.accounts || []).map((a: any) => ({ code: a.code, name: a.name })))
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !name) return

    try {
      setLoading(true)
      
      if (isEdit) {
        // TODO: Implementar PUT /api/accounts/:id
        const res = await fetch(`/api/accounts/${account.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            code,
            name,
            nature,
            accountType,
            parentCode: parentCode || null,
            isTemplate,
            requiresCostCenter,
            appliesWithholding,
            appliesTaxes,
            niifCode: niifCode || null,
            closingAccountCode: closingAccountCode || null,
          }),
        })
        if (!res.ok) throw new Error('Error actualizando cuenta')
      } else {
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            code,
            name,
            nature,
            accountType,
            parentCode: parentCode || null,
            isTemplate,
            requiresCostCenter,
            appliesWithholding,
            appliesTaxes,
            niifCode: niifCode || null,
            closingAccountCode: closingAccountCode || null,
          }),
        })
        if (!res.ok) throw new Error('Error creando cuenta')
      }

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      alert(error?.message ?? 'Error guardando cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica los datos de la cuenta contable.' : 'Crea una nueva cuenta en el plan de cuentas.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código PUC</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: 110505"
                disabled={isEdit}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Cuenta</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Caja General"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nature">Naturaleza</Label>
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger id="nature">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEUDORA">DEUDORA</SelectItem>
                  <SelectItem value="ACREEDORA">ACREEDORA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountType">Tipo de Cuenta</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger id="accountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                  <SelectItem value="PASIVO">PASIVO</SelectItem>
                  <SelectItem value="PATRIMONIO">PATRIMONIO</SelectItem>
                  <SelectItem value="INGRESOS">INGRESOS</SelectItem>
                  <SelectItem value="GASTOS">GASTOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="niifCode">Código NIIF (opcional)</Label>
              <Input
                id="niifCode"
                value={niifCode}
                onChange={(e) => setNiifCode(e.target.value)}
                placeholder="Ej: NIIF-XYZ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parentCode">Código Cuenta Padre (opcional)</Label>
              <Input
                id="parentCode"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                placeholder="Ej: 1105"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="closingAccountCode">Código Cuenta de Cierre (opcional)</Label>
              <Popover open={closingAccountOpen} onOpenChange={setClosingAccountOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setClosingAccountOpen(true)}
                  >
                    {closingAccountCode ? (
                      <span>{closingAccountCode}</span>
                    ) : (
                      <span className="text-muted-foreground">Buscar cuenta...</span>
                    )}
                    <Search className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar código o nombre..."
                      onValueChange={handleSearchClosingAccount}
                      value={closingAccountSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron cuentas.</CommandEmpty>
                      {closingAccountOptions.length > 0 && (
                        <CommandGroup>
                          {closingAccountOptions.map((opt) => (
                            <CommandItem
                              key={opt.code}
                              value={opt.code}
                              onSelect={() => {
                                setClosingAccountCode(opt.code)
                                setClosingAccountOpen(false)
                              }}
                            >
                              <span className="font-mono text-sm">{opt.code}</span>
                              <span className="ml-2 flex-1 truncate text-muted-foreground">{opt.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                <Checkbox id="isTemplate" checked={isTemplate} onCheckedChange={(v) => setIsTemplate(Boolean(v))} />
                <Label htmlFor="isTemplate">Es plantilla</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="requiresCostCenter" checked={requiresCostCenter} onCheckedChange={(v) => setRequiresCostCenter(Boolean(v))} />
                <Label htmlFor="requiresCostCenter">Requiere centros de costo</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="appliesWithholding" checked={appliesWithholding} onCheckedChange={(v) => setAppliesWithholding(Boolean(v))} />
                <Label htmlFor="appliesWithholding">Aplica retenciones</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="appliesTaxes" checked={appliesTaxes} onCheckedChange={(v) => setAppliesTaxes(Boolean(v))} />
                <Label htmlFor="appliesTaxes">Aplica impuestos</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
