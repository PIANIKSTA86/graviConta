"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
    TrendingUp,
    Wallet,
    CreditCard,
    Activity,
    Plus,
    Receipt,
    Users,
    FileText,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Metric {
    value: number
    change: number
    trend: "up" | "down"
}

interface DashboardMetrics {
    totalAssets: Metric
    totalLiabilities: Metric
    equity: Metric
    cashFlow: Metric
}

interface Activity {
    id: string
    type: string
    description: string
    amount: number
    date: string
    status: string
}

const quickActions = [
    {
        title: "Nueva Factura",
        description: "Crear factura de venta",
        icon: Receipt,
        href: "/dashboard/facturas/nueva",
        color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
        title: "Nuevo Gasto",
        description: "Registrar compra o gasto",
        icon: FileText,
        href: "/dashboard/facturas-compra/nueva",
        color: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
    {
        title: "Nuevo Tercero",
        description: "Agregar cliente o proveedor",
        icon: Users,
        href: "/dashboard/terceros/nuevo",
        color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
        title: "Nuevo Comprobante",
        description: "Crear comprobante contable",
        icon: DollarSign,
        href: "/dashboard/comprobantes/nuevo",
        color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
]

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
    const [activity, setActivity] = useState<Activity[]>([])
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
    const [isLoadingActivity, setIsLoadingActivity] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchMetrics()
        fetchActivity()
    }, [])

    const fetchMetrics = async () => {
        try {
            // Cookies are sent automatically with credentials: 'include'
            const response = await fetch('/api/dashboard/metrics', {
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Error al cargar métricas')
            }

            const data = await response.json()
            setMetrics(data.metrics)
        } catch (err) {
            setError('Error al cargar las métricas del dashboard')
            console.error(err)
        } finally {
            setIsLoadingMetrics(false)
        }
    }

    const fetchActivity = async () => {
        try {
            // Cookies are sent automatically with credentials: 'include'
            const response = await fetch('/api/dashboard/recent-activity', {
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Error al cargar actividad')
            }

            const data = await response.json()
            setActivity(data.activity)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoadingActivity(false)
        }
    }

    const metricCards = metrics ? [
        {
            title: "Activos Totales",
            value: formatCurrency(metrics.totalAssets.value),
            change: `${metrics.totalAssets.change > 0 ? '+' : ''}${metrics.totalAssets.change.toFixed(1)}%`,
            trend: metrics.totalAssets.trend,
            icon: Wallet,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Pasivos Totales",
            value: formatCurrency(metrics.totalLiabilities.value),
            change: `${metrics.totalLiabilities.change > 0 ? '+' : ''}${metrics.totalLiabilities.change.toFixed(1)}%`,
            trend: metrics.totalLiabilities.trend,
            icon: CreditCard,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
        {
            title: "Patrimonio",
            value: formatCurrency(metrics.equity.value),
            change: `${metrics.equity.change > 0 ? '+' : ''}${metrics.equity.change.toFixed(1)}%`,
            trend: metrics.equity.trend,
            icon: TrendingUp,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            title: "Flujo de Caja",
            value: formatCurrency(metrics.cashFlow.value),
            change: `${metrics.cashFlow.change > 0 ? '+' : ''}${metrics.cashFlow.change.toFixed(1)}%`,
            trend: metrics.cashFlow.trend,
            icon: Activity,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
    ] : []

    if (error) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Resumen general de tu empresa
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transacción
                </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoadingMetrics ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    metricCards.map((metric) => (
                        <Card key={metric.title} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {metric.title}
                                </CardTitle>
                                <div className={`rounded-lg p-2 ${metric.bgColor}`}>
                                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metric.value}</div>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    {metric.trend === "up" ? (
                                        <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                                    )}
                                    <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                                        {metric.change}
                                    </span>
                                    <span className="ml-1">vs mes anterior</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>
                            Últimas transacciones registradas en el sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingActivity ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : activity.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay transacciones registradas
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activity.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        {index > 0 && <Separator />}
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {item.type}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.date}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={item.status === "completed" ? "default" : "secondary"}
                                                >
                                                    {item.status === "completed" ? "Completado" : "Pendiente"}
                                                </Badge>
                                                <span className="text-sm font-semibold">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" className="w-full mt-4">
                            Ver todas las transacciones
                        </Button>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                        <CardDescription>
                            Accesos directos a funciones comunes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quickActions.map((action) => (
                            <Link key={action.title} href={action.href}>
                                <div className={`${action.color} rounded-lg p-4 text-white transition-all hover:scale-105 hover:shadow-lg cursor-pointer`}>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-md bg-white/20 p-2">
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{action.title}</p>
                                            <p className="text-xs text-white/80">{action.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
