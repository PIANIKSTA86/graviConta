"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"

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
}

interface ThirdPartyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  thirdParty?: ThirdParty | null
}

const IDENTIFICATION_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
]

const THIRD_PARTY_TYPES = [
  { value: 'CUSTOMER', label: 'Cliente' },
  { value: 'SUPPLIER', label: 'Proveedor' },
  { value: 'EMPLOYEE', label: 'Empleado' },
  { value: 'BOTH', label: 'Cliente/Proveedor' },
]

const TAX_REGIMES = [
  { value: 'COMUN', label: 'Común' },
  { value: 'SIMPLIFICADO', label: 'Simplificado' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
]

const FISCAL_RESPONSIBILITIES = [
  { value: 'IVA', label: 'Responsable de IVA' },
  { value: 'ICA', label: 'Responsable de ICA' },
  { value: 'RETEFUENTE', label: 'Agente de Retención' },
  { value: 'RETEIVA', label: 'Régimen Común' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
  { value: 'AUTORETENEDOR', label: 'Autoretenedor' },
]

export function ThirdPartyDialog({ open, onOpenChange, onSuccess, thirdParty }: ThirdPartyDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    identificationType: thirdParty?.identificationType || 'NIT',
    identificationNumber: thirdParty?.identificationNumber || '',
    name: thirdParty?.name || '',
    commercialName: thirdParty?.commercialName || '',
    address: thirdParty?.address || '',
    phone: thirdParty?.phone || '',
    email: thirdParty?.email || '',
    city: thirdParty?.city || '',
    department: thirdParty?.department || '',
    type: thirdParty?.type || 'CUSTOMER',
    taxRegime: thirdParty?.taxRegime || 'COMUN',
    isAutoRetainer: thirdParty?.isAutoRetainer || false,
    fiscalResponsibilities: thirdParty?.fiscalResponsibilities ? JSON.parse(thirdParty.fiscalResponsibilities) : [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth-token')
      
      const url = thirdParty 
        ? `/api/third-parties/${thirdParty.id}`
        : '/api/third-parties'
      
      const method = thirdParty ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        fiscalResponsibilities: JSON.stringify(formData.fiscalResponsibilities),
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el tercero')
      }

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        identificationType: 'NIT',
        identificationNumber: '',
        name: '',
        commercialName: '',
        address: '',
        phone: '',
        email: '',
        city: '',
        department: '',
        type: 'CUSTOMER',
        taxRegime: 'COMUN',
        isAutoRetainer: false,
        fiscalResponsibilities: [],
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleFiscalResponsibilityChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      fiscalResponsibilities: checked
        ? [...prev.fiscalResponsibilities, value]
        : prev.fiscalResponsibilities.filter((r: string) => r !== value)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {thirdParty ? 'Editar Tercero' : 'Crear Nuevo Tercero'}
          </DialogTitle>
          <DialogDescription>
            {thirdParty 
              ? 'Actualiza la información del tercero.' 
              : 'Ingresa la información del nuevo tercero (cliente, proveedor o empleado).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identificationType">Tipo de Identificación*</Label>
              <Select
                value={formData.identificationType}
                onValueChange={(value) => setFormData({ ...formData, identificationType: value })}
                disabled={!!thirdParty}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDENTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificationNumber">Número de Identificación*</Label>
              <Input
                id="identificationNumber"
                value={formData.identificationNumber}
                onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                required
                disabled={!!thirdParty}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre/Razón Social*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commercialName">Nombre Comercial</Label>
              <Input
                id="commercialName"
                value={formData.commercialName}
                onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Tercero*</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THIRD_PARTY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRegime">Régimen Tributario*</Label>
              <Select
                value={formData.taxRegime}
                onValueChange={(value) => setFormData({ ...formData, taxRegime: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_REGIMES.map((regime) => (
                    <SelectItem key={regime.value} value={regime.value}>
                      {regime.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsabilidades Fiscales</Label>
            <div className="grid grid-cols-2 gap-2">
              {FISCAL_RESPONSIBILITIES.map((resp) => (
                <div key={resp.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={resp.value}
                    checked={formData.fiscalResponsibilities.includes(resp.value)}
                    onCheckedChange={(checked) => 
                      handleFiscalResponsibilityChange(resp.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={resp.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {resp.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAutoRetainer"
              checked={formData.isAutoRetainer}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isAutoRetainer: checked as boolean })
              }
            />
            <label
              htmlFor="isAutoRetainer"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Autoretenedor
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : thirdParty ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
