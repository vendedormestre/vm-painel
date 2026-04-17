'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const TABS = [
  { value: 'candidatos', label: 'Candidatos' },
  { value: 'leads',      label: 'Leads B2B'  },
]

export function TabBar({ activeTab }: { activeTab: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goTab(tab: string) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    // reset page when switching tabs
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#F5F4F2', width: 'fit-content' }}>
      {TABS.map(t => {
        const active = t.value === activeTab
        return (
          <button
            key={t.value}
            onClick={() => goTab(t.value)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              backgroundColor: active ? '#FFFFFF' : 'transparent',
              color: active ? '#0A0A0A' : '#8A8986',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: active ? 'default' : 'pointer',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
