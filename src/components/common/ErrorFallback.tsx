"use client"

import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorFallbackProps {
  error: Error
  reset: () => void
  title?: string
}

export function ErrorFallback({
  error,
  reset,
  title = "Algo salió mal",
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm">{error.message || "Error desconocido"}</p>
            <button
              onClick={reset}
              className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Intentar de nuevo
            </button>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}
