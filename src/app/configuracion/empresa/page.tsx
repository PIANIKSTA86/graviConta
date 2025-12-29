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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Empresa</h1>
        <p className="text-muted-foreground">Gestiona los datos generales de tu empresa</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos Básicos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Datos Básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>NIT (no editable)</Label>
                <Input value={form.nit} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Razón Social *</Label>
                <Input value={form.name} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Nombre Comercial</Label>
                <Input
                  value={form.commercialName || ''}
                  onChange={(e) => setForm({ ...form, commercialName: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identificación */}
        <Card>
          <CardHeader>
            <CardTitle>Identificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Documento *</Label>
              <Select value={form.documentType || '31'} onValueChange={(v) => setForm({ ...form, documentType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{k} - {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isPersonaNatural && (
              <div>
                <Label>Dígito de Verificación</Label>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={form.verificationDigit ?? ''}
                  onChange={(e) => setForm({ ...form, verificationDigit: parseInt(e.target.value) || undefined })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Persona Natural */}
        {isPersonaNatural && (
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombres *</Label>
                <Input
                  value={form.firstName || ''}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Apellidos *</Label>
                <Input
                  value={form.lastName || ''}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>País *</Label>
              <Select value={form.country || 'Colombia'} onValueChange={(v) => setForm({ ...form, country: v, department: v !== 'Colombia' ? null : form.department, city: v !== 'Colombia' ? null : form.city })}>
                <SelectTrigger>
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
                  <Label>Departamento *</Label>
                  <Select value={form.department || ''} onValueChange={(v) => setForm({ ...form, department: v, city: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DEPARTMENTS_CITIES).map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.department && (
                  <div>
                    <Label>Ciudad *</Label>
                    <Select value={form.city || ''} onValueChange={(v) => setForm({ ...form, city: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div>
              <Label>Dirección</Label>
              <Input
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Teléfono</Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Móvil</Label>
              <Input
                value={form.mobile || ''}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
            <div>
              <Label>Email Principal</Label>
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Email Alterno</Label>
              <Input
                type="email"
                value={form.email2 || ''}
                onChange={(e) => setForm({ ...form, email2: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clasificación Tributaria */}
        <Card>
          <CardHeader>
            <CardTitle>Clasificación Tributaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Contribuyente</Label>
              <Select value={form.contributorType || '1'} onValueChange={(v) => setForm({ ...form, contributorType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Jurídica</SelectItem>
                  <SelectItem value="2">Natural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Régimen de Impuesto</Label>
              <Select value={form.taxRegime || '48'} onValueChange={(v) => setForm({ ...form, taxRegime: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAX_REGIMES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Actividad Económica (CIIU)</Label>
              <Input
                value={form.economicActivity || ''}
                onChange={(e) => setForm({ ...form, economicActivity: e.target.value })}
                placeholder="Ej: 6202"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview && (
              <div className="flex justify-center">
                <img src={logoPreview} alt="Logo" className="max-h-32 max-w-32" />
              </div>
            )}
            <div>
              <Label>Cargar Logo</Label>
              <Input type="file" accept="image/*" onChange={handleLogoChange} />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.useLogoInDocuments ?? true}
                onCheckedChange={(v) => setForm({ ...form, useLogoInDocuments: v })}
              />
              <Label>Usar logo en documentos oficiales</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end gap-2">
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
  )
}
