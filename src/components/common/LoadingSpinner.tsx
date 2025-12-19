"use client"

import { motion } from "framer-motion"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
}

const sizeMap = {
  sm: { container: 24, dot: 4 },
  md: { container: 40, dot: 6 },
  lg: { container: 56, dot: 8 },
}

export function LoadingSpinner({
  size = "md",
  message = "Cargando...",
}: LoadingSpinnerProps) {
  const sizes = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        style={{
          width: sizes.container,
          height: sizes.container,
        }}
        className="flex items-center justify-center"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500"
            style={{
              width: sizes.dot,
              height: sizes.dot,
            }}
            animate={{
              scale: [1, 0.8, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
