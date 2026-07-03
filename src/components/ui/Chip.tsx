'use client'
import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface ChipProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  tone?: 'default' | 'local'
}

export function Chip({ children, active, onClick, tone = 'default' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap border border-transparent transition-all',
        tone === 'default' && (active
          ? 'bg-ink text-white'
          : 'bg-bg-alt text-ink-soft hover:bg-line'),
        tone === 'local' && 'bg-amber-tint text-amber-deep border-amber/30',
        onClick && 'cursor-pointer',
      )}
    >
      {children}
    </button>
  )
}
