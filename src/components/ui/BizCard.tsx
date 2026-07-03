'use client'
import { type Business, type Mode } from '@/lib/data'
import { clsx } from 'clsx'

interface BizCardProps {
  biz: Business
  mode: Mode
  onOpen?: (biz: Business) => void
  onBook?: (biz: Business) => void
  compact?: boolean
}

function PriceDots({ n }: { n: number }) {
  return (
    <span className="text-[12px] text-ink-soft">
      {'$'.repeat(n)}<span className="opacity-30">{'$'.repeat(3 - n)}</span>
    </span>
  )
}

export function BizCard({ biz, mode, onOpen, onBook, compact }: BizCardProps) {
  const en = mode === 'explorer'
  const desc = en ? biz.en : biz.es

  return (
    <div
      className={clsx(
        'rounded-[22px] bg-surface overflow-hidden shadow-[0_10px_30px_rgba(34,28,25,.10)] cursor-pointer transition-transform hover:scale-[1.01] active:scale-[.99]',
        compact ? 'w-52 flex-shrink-0' : 'w-full',
      )}
      onClick={() => onOpen?.(biz)}
    >
      {/* Photo placeholder */}
      <div
        className="relative"
        style={{
          height: compact ? 110 : 150,
          background: `linear-gradient(140deg, ${biz.grad[0]}, ${biz.grad[1]})`,
        }}
      >
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 80% -10%, rgba(255,255,255,.28), transparent 55%)' }} />
        <span className="absolute right-[-8px] bottom-[-18px] text-white/16 font-extrabold leading-none select-none"
          style={{ fontSize: (compact ? 110 : 150) * 0.9, fontFamily: 'var(--font-display)' }}>
          {biz.mono}
        </span>
        {biz.featured && (
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[10.5px] font-bold tracking-wide uppercase bg-dusk/85 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
            ✦ Destacado
          </span>
        )}
        {biz.localFav && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-bold text-amber-deep bg-amber-tint px-2 py-0.5 rounded-full">
            ★ {en ? 'Local fav' : 'Favorito local'}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-[14.5px] text-ink leading-tight line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>{biz.name}</p>
          <span className="text-[12.5px] font-semibold text-ink-soft flex items-center gap-1 shrink-0">
            ★ <span className="text-ink">{biz.rating}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-ink-soft mb-2">
          <span>{biz.type}</span>
          <span>·</span>
          <PriceDots n={biz.price} />
          <span>·</span>
          <span>{biz.dist} km</span>
        </div>

        {!compact && <p className="text-[13px] text-ink-soft leading-relaxed mb-3 line-clamp-2">{desc}</p>}

        {!compact && (
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); onOpen?.(biz) }}
              className="flex-1 text-[13.5px] font-semibold text-ink border border-line rounded-full py-2 hover:bg-bg-alt transition-colors"
            >
              {en ? 'See more' : 'Ver más'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onBook?.(biz) }}
              className="flex-1 text-[13.5px] font-semibold text-white bg-coral rounded-full py-2 hover:bg-[#D23B47] transition-colors shadow-[0_4px_12px_rgba(232,80,91,.3)]"
            >
              {en ? 'Reserve' : 'Reservar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
