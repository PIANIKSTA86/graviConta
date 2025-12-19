"use client"

import { motion } from "framer-motion"

interface SkeletonProps {
  className?: string
  count?: number
}

export function SkeletonLoader({
  className = "h-12 w-full",
  count = 1,
}: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`rounded-lg bg-muted ${className}`}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <SkeletonLoader className="h-8 w-1/3" />
      <SkeletonLoader className="h-4 w-full" count={3} />
      <div className="flex gap-2 pt-2">
        <SkeletonLoader className="h-10 w-24" />
        <SkeletonLoader className="h-10 w-24" />
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonLoader className="h-10 w-full" />
      <SkeletonLoader className="h-12 w-full" count={5} />
    </div>
  )
}
