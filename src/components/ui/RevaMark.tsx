'use client'

interface RevaMarkProps { size?: number; className?: string }

export function RevaMark({ size = 46, className }: RevaMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" className={className}>
      <rect width="46" height="46" rx="14" fill="#E8505B" />
      <path d="M11 30c0-7.2 5.6-13 12-13s12 5.8 12 13" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="23" cy="30" r="3.3" fill="#fff" />
      <path d="M23 30L23 37.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}
