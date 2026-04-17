type Stage = { label: string; count: number }

function pct(a: number, b: number) {
  if (b === 0) return 0
  return Math.round((a / b) * 100)
}

export function ConversionFunnel({ stages }: { stages: Stage[] }) {
  const max = stages[0]?.count || 1

  return (
    <div className="flex flex-col gap-4">
      {stages.map((stage, i) => {
        const widthPct = max > 0 ? Math.round((stage.count / max) * 100) : 0
        const conversion = i > 0 && stages[i - 1].count > 0
          ? pct(stage.count, stages[i - 1].count)
          : null

        return (
          <div key={stage.label}>
            {conversion !== null && (
              <p className="text-xs mb-1.5" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                ↳ {conversion}% avançaram
              </p>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-full h-6 overflow-hidden" style={{ backgroundColor: '#C8C7C3' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: '#0A0A0A',
                    minWidth: stage.count > 0 ? '1.5rem' : '0',
                  }}
                />
              </div>
              <div className="flex items-baseline gap-1.5" style={{ minWidth: '7rem', justifyContent: 'flex-end' }}>
                <span
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}
                >
                  {stage.count.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                  {stage.label}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
