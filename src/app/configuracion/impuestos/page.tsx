"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ImpuestosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Impuestos</h1>
        <p className="text-muted-foreground">Configuración de tasas y reglas fiscales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Impuestos</CardTitle>
          <CardDescription>
            Configura las tasas de impuestos y reglas fiscales aplicables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Funcionalidad en desarrollo. Próximamente podrás configurar impuestos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}