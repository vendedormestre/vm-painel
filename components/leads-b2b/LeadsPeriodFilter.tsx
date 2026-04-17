'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const OPTIONS = [
  { value: 'mes', label: 'Este mês' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: 'all', label: 'Todo o período' },
]

export function LeadsPeriodFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function set(v: string) {
    const params = new URLSearchParams(searchParams)
    params.set('lp', v)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {OPTIONS.map(o => {
        const active = current === o.value
        return (
          <button
            key={o.value}
            onClick={() => set(o.value)}
            className="px-3 py-1.5 rounded-md text-xs transition-all"
            style={{
              backgroundColor: active ? '#0A0A0A' : '#FFFFFF',
              color: active ? '#F5F4F2' : '#8A8986',
              border: `1px solid ${active ? '#0A0A0A' : '#C8C7C3'}`,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
