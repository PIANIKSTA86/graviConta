import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query"

const API_BASE = "/api"

interface FetchOptions {
  headers?: Record<string, string>
}

// API Queries
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/dashboard/metrics`)
      if (!response.ok) throw new Error("Error fetching metrics")
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/dashboard/recent-activity`)
      if (!response.ok) throw new Error("Error fetching activity")
      return response.json()
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/invoices`)
      if (!response.ok) throw new Error("Error fetching invoices")
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  })
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/transactions`)
      if (!response.ok) throw new Error("Error fetching transactions")
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/reports`)
      if (!response.ok) throw new Error("Error fetching reports")
      return response.json()
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// API Mutations
export function useSendInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`${API_BASE}/invoices/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      })
      if (!response.ok) throw new Error("Error sending invoice")
      return response.json()
    },
  })
}

export function useCreateTransaction() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Error creating transaction")
      return response.json()
    },
  })
}
