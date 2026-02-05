'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function Stagger({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.2, margin: '-80px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.12,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
}: {
  children: ReactNode
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  )
}
