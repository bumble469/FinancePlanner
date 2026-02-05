'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2, margin: '-80px' }}
      transition={{
        duration: 0.6,
        ease: 'easeOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}
