"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  duration?: number
  delay?: number
}

interface SlideInProps extends FadeInProps {
  direction?: "up" | "down" | "left" | "right"
}

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function FadeIn({ children, duration = 0.5, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({
  children,
  direction = "up",
  duration = 0.5,
  delay = 0,
}: SlideInProps) {
  const variants = {
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
    },
    left: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
    },
    right: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
    },
  }

  const variant = variants[direction]

  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
}: {
  children: ReactNode
  staggerDelay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
