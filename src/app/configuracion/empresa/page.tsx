'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

const DOCUMENT_TYPES = {
  '11': 'Registro civil',
  '12': 'Tarjeta de identidad',
  '13': 'Cédula de ciudadanía',
  '21': 'Tarjeta de extranjería',
  '22': 'Cédula de extranjería',
  '31': 'NIT',
  '41': 'Pasaporte',
  '42': 'Documento de identificación extranjero',
  '47': 'PEP (Permiso Especial de Permanencia)',
  '48': 'PPT (Permiso Protección Temporal)',
  '50': 'NIT de otro país',
  '91': 'NUIP',
}

const DEPARTMENTS_CITIES: { [key: string]: string[] } = {
  'Cundinamarca': ['Bogotá', 'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Girardot'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Sabaneta'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Jamundí'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
  'Tolima': ['Ibagué', 'Espinal', 'Melgar', 'Honda'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada'],
  'Caldas': ['Manizales', 'La Dorada', 'Chinchiná'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'],
  'Quindío': ['Armenia', 'Calarcá', 'Montenegro'],
  'Cauca': ['Popayán', 'Santander de Quilichao'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón'],
  'Cesar': ['Valledupar', 'Aguachica'],
  'Córdoba': ['Montería', 'Cereté', 'Lorica'],
  'Sucre': ['Sincelejo', 'Corozal'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso'],
}

const COUNTRIES = ['Colombia', 'Argentina', 'Brasil', 'Chile', 'Ecuador', 'Perú', 'Venezuela', 'Panamá', 'Costa Rica', 'México', 'Otro']

const TAX_REGIMES = {
  '47': 'RST (Régimen Simple de Tributación)',
  '48': 'Responsable de IVA',
  '49': 'No Responsable de IVA',
  '50': 'RST con INC',
  '33': 'Responsable INC',
}

interface CompanyData {
  nit: string
  name: string
  commercialName?: string
  documentType?: string
  verificationDigit?: number
  firstName?: string
  lastName?: string
  country?: string
  department?: string
  city?: string
  address?: string
  phone?: string
  mobile?: string
  email?: string
  email2?: string
  logo?: string
  economicActivity?: string
  contributorType?: string
  taxRegime?: string
  useLogoInDocuments?: boolean
}

export default function CompanyPage() {
  const [form, setForm] = useState<CompanyData>({
    nit: '',
    name: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const isPersonaNatural = form.documentType && ['11', '12', '13', '21', '22'].includes(form.documentType)
  const availableCities = form.country === 'Colombia' && form.department 
    ? DEPARTMENTS_CITIES[form.department] || [] 
    : []

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch('/api/company', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setForm(data)
        if (data.logo) setLogoPreview(data.logo)
        toast.success('Datos de empresa cargados')
      } else {
        toast.error('Error al cargar los datos de la empresa')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo no debe superar 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setLogoPreview(base64)
      setForm({ ...form, logo: base64 })
      toast.success('Logo cargado exitosamente')
    }
    reader.onerror = () => {
      toast.error('Error al cargar la imagen')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    try {
      // Validaciones antes de enviar
      if (isPersonaNatural && (!form.firstName?.trim() || !form.lastName?.trim())) {
        toast.error('Nombres y apellidos son requeridos para personas naturales')
        return
      }

      if (form.country === 'Colombia' && (!form.department || !form.city)) {
        toast.error('Departamento y ciudad son requeridos para empresas en Colombia')
        return
      }

      setSaving(true)
      toast.loading('Guardando cambios...', { id: 'saving' })
      
      const token = localStorage.getItem('auth-token')
      
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('Empresa actualizada exitosamente', { id: 'saving' })
        setForm(data.company)
      } else {
        toast.error(data.error || 'Error al actualizar', { id: 'saving' })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión al guardar', { id: 'saving' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Cargando...</div>

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Empresa</h1>
          <p className="text-muted-foreground mt-1">Gestiona los datos generales de tu empresa</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              load()
              toast.info('Cambios descartados')
            }} 
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Grid Layout Principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Columna Izquierda - Información General */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Identificación y Datos Básicos */}
          <Card>
            <CardHeader>
              <CardTitle>Identificación y Razón Social</CardTitle>
              <CardDescription>Información legal y fiscal de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="nit">NIT / Número de Identificación</Label>
                  <Input id="nit" value={form.nit} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">No editable</p>
                </div>
                <div>
                  <Label htmlFor="documentType">Tipo de Documento *</Label>
                  <Select value={form.documentType || '31'} onValueChange={(v) => setForm({ ...form, documentType: v })}>
                    <SelectTrigger id="documentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{k} - {v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Razón Social *</Label>
                  <Input id="name" value={form.name} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">No editable</p>
                </div>
                <div>
                  <Label htmlFor="commercialName">Nombre Comercial</Label>
                  <Input
                    id="commercialName"
                    value={form.commercialName || ''}
                    onChange={(e) => setForm({ ...form, commercialName: e.target.value })}
                    placeholder="Nombre con el que opera"
                  />
                </div>
              </div>

              {!isPersonaNatural && (
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-1">
                    <Label htmlFor="verificationDigit">Dígito Verificación</Label>
                    <Input
                      id="verificationDigit"
                      type="number"
                      min="0"
                      max="9"
                      value={form.verificationDigit ?? ''}
                      onChange={(e) => setForm({ ...form, verificationDigit: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              )}

              {isPersonaNatural && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">Nombres *</Label>
                    <Input
                      id="firstName"
                      value={form.firstName || ''}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellidos *</Label>
                    <Input
                      id="lastName"
                      value={form.lastName || ''}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>Dirección física de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="country">País *</Label>
                  <Select value={form.country || 'Colombia'} onValueChange={(v) => setForm({ ...form, country: v, department: v !== 'Colombia' ? undefined : form.department, city: v !== 'Colombia' ? undefined : form.city })}>
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.country === 'Colombia' && (
                  <>
                    <div>
                      <Label htmlFor="department">Departamento *</Label>
                      <Select value={form.department || ''} onValueChange={(v) => setForm({ ...form, department: v, city: '' })}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(DEPARTMENTS_CITIES).map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="city">Ciudad *</Label>
                      <Select 
                        value={form.city || ''} 
                        onValueChange={(v) => setForm({ ...form, city: v })}
                        disabled={!form.department}
                      >
                        <SelectTrigger id="city">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="address">Dirección Completa</Label>
                <Input
                  id="address"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Calle, número, complemento"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>Teléfonos y correos electrónicos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Teléfono Fijo</Label>
                  <Input
                    id="phone"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(601) 234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Móvil / Celular</Label>
                  <Input
                    id="mobile"
                    value={form.mobile || ''}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="300 123 4567"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Principal *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email2">Email Alterno</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={form.email2 || ''}
                    onChange={(e) => setForm({ ...form, email2: e.target.value })}
                    placeholder="info@empresa.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clasificación Tributaria */}
          <Card>
            <CardHeader>
              <CardTitle>Clasificación Tributaria</CardTitle>
              <CardDescription>Información fiscal y régimen de impuestos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contributorType">Tipo de Contribuyente</Label>
                  <Select value={form.contributorType || '1'} onValueChange={(v) => setForm({ ...form, contributorType: v })}>
                    <SelectTrigger id="contributorType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Persona Jurídica</SelectItem>
                      <SelectItem value="2">Persona Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taxRegime">Régimen de Impuesto</Label>
                  <Select value={form.taxRegime || '48'} onValueChange={(v) => setForm({ ...form, taxRegime: v })}>
                    <SelectTrigger id="taxRegime">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TAX_REGIMES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="economicActivity">Actividad Económica (Código CIIU)</Label>
                <Input
                  id="economicActivity"
                  value={form.economicActivity || ''}
                  onChange={(e) => setForm({ ...form, economicActivity: e.target.value })}
                  placeholder="Ej: 6202 - Consultoría informática"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Clasificación Industrial Internacional Uniforme
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Logo y Extras */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Logo de la Empresa</CardTitle>
              <CardDescription>Imagen corporativa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="border-2 border-dashed rounded-lg p-4 w-full flex justify-center bg-muted/30">
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="max-h-40 max-w-full object-contain" 
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setLogoPreview(null)
                      setForm({ ...form, logo: undefined })
                    }}
                  >
                    Eliminar Logo
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Sin logo</p>
                  <p className="text-xs text-muted-foreground">
                    Sube una imagen (máx. 2MB)
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="logoFile">Cargar Logo</Label>
                <Input 
                  id="logoFile"
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG o SVG. Máximo 2MB
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Switch
                  id="useLogoInDocuments"
                  checked={form.useLogoInDocuments ?? true}
                  onCheckedChange={(v) => setForm({ ...form, useLogoInDocuments: v })}
                />
                <div className="flex-1">
                  <Label htmlFor="useLogoInDocuments" className="cursor-pointer">
                    Usar en documentos
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    El logo aparecerá en facturas, reportes y otros documentos oficiales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Información básica</span>
                <span className="text-green-600 font-medium">Completa</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ubicación</span>
                <span className={form.country && form.city ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                  {form.country && form.city ? 'Completa' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Logo</span>
                <span className={logoPreview ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  {logoPreview ? 'Cargado' : 'Opcional'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Info. Tributaria</span>
                <span className={form.taxRegime ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                  {form.taxRegime ? 'Completa' : 'Pendiente'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
