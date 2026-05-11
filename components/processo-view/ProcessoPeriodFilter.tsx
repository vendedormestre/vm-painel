'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Period } from '@/lib/data'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'mes', label: 'Este mês' },
]

export function ProcessoPeriodFilter({ current }: { current: Period }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setPeriod(period: Period) {
    const params = new URLSearchParams(searchParams)
    params.set('pvp', period)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {PERIODS.map(p => {
        const active = current === p.value
        return (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className="px-4 py-2 rounded-md text-sm transition-all"
            style={{
              backgroundColor: active ? '#0D0B0A' : '#FFFFFF',
              color: active ? '#F4F3F1' : '#0D0B0A',
              border: `1px solid ${active ? '#0D0B0A' : '#C8C7C3'}`,
              fontFamily: 'var(--font-barlow)',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
