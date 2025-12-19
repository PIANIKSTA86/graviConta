"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountValidationAlert, AccountRulesDisplay } from '@/components/common/AccountValidationAlert'
import { useAccountValidation } from '@/hooks/useAccountValidation'
import { Loader2 } from 'lucide-react'

interface AccountValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  accountCode: string
  token: string
}

export function AccountValidationDialog({
  open,
  onOpenChange,
  accountId,
  accountCode,
  token,
}: AccountValidationDialogProps) {
  const [costCenterId, setCostCenterId] = useState('')
  const [hasWithholding, setHasWithholding] = useState(false)
  const [hasTax, setHasTax] = useState(false)
  const [validation, setValidation] = useState<any>(null)
  const { validateAccount, isValidating } = useAccountValidation(token)

  const handleValidate = async () => {
    const result = await validateAccount(accountId, costCenterId, hasWithholding, hasTax)
    setValidation(result)
  }

  const handleReset = () => {
    setValidation(null)
    setCostCenterId('')
    setHasWithholding(false)
    setHasTax(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Validar Reglas - {accountCode}</DialogTitle>
          <DialogDescription>
            Verifica si esta cuenta cumple con sus reglas configuradas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="costCenter">Centro de Costo (opcional)</Label>
            <Input
              id="costCenter"
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              placeholder="ID del centro de costo"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="withholding"
              checked={hasWithholding}
              onChange={(e) => setHasWithholding(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="withholding" className="cursor-pointer">
              Tiene configuración de retenciones
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tax"
              checked={hasTax}
              onChange={(e) => setHasTax(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="tax" className="cursor-pointer">
              Tiene configuración de impuestos
            </Label>
          </div>

          {validation && (
            <div className="grid gap-2">
              <AccountValidationAlert validation={validation} loading={isValidating} />
              <AccountRulesDisplay rules={validation.rules} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isValidating}>
            Limpiar
          </Button>
          <Button onClick={handleValidate} disabled={isValidating} className="flex-1">
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
