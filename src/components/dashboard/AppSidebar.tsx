"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Receipt,
  Wallet,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Contabilidad",
    icon: Wallet,
    items: [
      { title: "Plan de Cuentas", href: "/dashboard/plan-cuentas" },
      { title: "Comprobantes", href: "/dashboard/comprobantes" },
      { title: "Períodos Contables", href: "/dashboard/periodos" },
    ],
  },
  {
    title: "Facturación",
    icon: Receipt,
    items: [
      { title: "Facturas de Venta", href: "/dashboard/facturas" },
      { title: "Facturas de Compra", href: "/dashboard/facturas-compra" },
      { title: "Pagos", href: "/dashboard/pagos" },
    ],
  },
  {
    title: "Terceros",
    icon: Users,
    href: "/dashboard/terceros",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    items: [
      { title: "Balance General", href: "/dashboard/reportes/balance" },
      { title: "Estado de Resultados", href: "/dashboard/reportes/resultados" },
      { title: "Flujo de Caja", href: "/dashboard/reportes/flujo-caja" },
    ],
  },
  {
    title: "Configuración",
    icon: Settings,
    items: [
      { title: "Empresa", href: "/dashboard/configuracion/empresa" },
      { title: "Impuestos", href: "/dashboard/configuracion/impuestos" },
      { title: "Usuarios", href: "/dashboard/configuracion/usuarios" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">GraviConta</span>
            <span className="text-xs text-muted-foreground">Sistema Contable</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (!item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href!}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <Collapsible key={item.title} asChild defaultOpen={pathname.includes(item.title.toLowerCase())}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                <Link href={subItem.href}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          © 2025 GraviConta
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
