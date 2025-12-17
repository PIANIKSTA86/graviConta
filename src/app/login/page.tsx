"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            console.log('🔐 Intentando login...')
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            console.log('📡 Respuesta recibida:', response.status)
            const data = await response.json()
            console.log('📦 Datos:', data)

            if (!response.ok) {
                console.error('❌ Error de login:', data.error)
                setError(data.error || "Error al iniciar sesión")
                setIsLoading(false)
                return
            }

            // Store token in localStorage as backup
            if (data.token) {
                console.log('💾 Guardando token...')
                localStorage.setItem("auth-token", data.token)
            }

            console.log('✅ Login exitoso!')
            console.log('🚀 Redirigiendo al dashboard...')

            // Direct redirect to dashboard
            window.location.href = "/dashboard"
        } catch (err) {
            console.error('❌ Error de conexión:', err)
            setError("Error de conexión. Por favor intenta de nuevo.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                        <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">GraviConta</CardTitle>
                        <CardDescription className="text-base">
                            Sistema de Contabilidad Moderna
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="demo@graviconta.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </Button>

                        <div className="rounded-lg bg-muted p-4 text-sm">
                            <p className="font-semibold mb-2">Credenciales de Demo:</p>
                            <p className="text-muted-foreground">
                                Email: <code className="text-xs bg-background px-1 py-0.5 rounded">demo@graviconta.com</code>
                            </p>
                            <p className="text-muted-foreground">
                                Password: <code className="text-xs bg-background px-1 py-0.5 rounded">demo123</code>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
