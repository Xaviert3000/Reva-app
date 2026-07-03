'use client'
import { type ReactNode } from 'react'
import { clsx } from 'clsx'

type BtnKind = 'primary' | 'dark' | 'ghost' | 'quiet' | 'jade'
type BtnSize = 'sm' | 'md' | 'lg'

interface BtnProps {
  kind?: BtnKind
  size?: BtnSize
  full?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}

const kinds: Record<BtnKind, string> = {
  primary: 'bg-coral text-white shadow-[0_8px_20px_rgba(232,80,91,.30)] hover:bg-[#D23B47]',
  dark: 'bg-ink text-white hover:bg-[#3a3028]',
  ghost: 'bg-transparent text-ink border border-line hover:bg-bg-alt',
  quiet: 'bg-bg-alt text-ink hover:bg-line',
  jade: 'bg-jade text-white shadow-[0_8px_20px_rgba(31,138,109,.26)] hover:bg-[#197559]',
}

const sizes: Record<BtnSize, string> = {
  sm: 'text-[14px] px-[15px] py-[9px]',
  md: 'text-[15.5px] px-5 py-[13px]',
  lg: 'text-[16.5px] px-[22px] py-4',
}

export function Btn({ kind = 'primary', size = 'md', full, onClick, children, className, disabled, type = 'button' }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all active:scale-[.97] cursor-pointer select-none',
        kinds[kind],
        sizes[size],
        full && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
