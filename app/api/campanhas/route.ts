import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const empresa   = searchParams.get('empresa')
  const cargo     = searchParams.get('cargo')
  const date_from = searchParams.get('date_from')
  const date_to   = searchParams.get('date_to')

  if (!empresa || !cargo || !date_from || !date_to) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('campanhas_investimento')
    .select('spend, leads')
    .ilike('campaign_name', `%${empresa}%`)
    .ilike('campaign_name', `%${cargo}%`)
    .gte('date', date_from)
    .lte('date', date_to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as { spend: number | null; leads: number | null }[]
  const total_spend = rows.reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const total_leads = rows.reduce((s, r) => s + (Number(r.leads) || 0), 0)
  const cpl_medio   = total_leads > 0 ? Math.round((total_spend / total_leads) * 100) / 100 : null

  return NextResponse.json({ total_spend, total_leads, cpl_medio, matched_rows: rows.length })
}
