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

  // Fetch all campaigns in period — filter by words in JS to handle
  // format mismatches like "Febracis Floripa" vs "[FEBRACIS] [FLORIPA]"
  const { data, error } = await supabase
    .from('campanhas_investimento')
    .select('campaign_name, spend, leads')
    .gte('date', date_from)
    .lte('date', date_to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Break empresa + cargo into words of 3+ chars, lowercase
  const palavras = [...empresa.split(' '), ...cargo.split(' ')]
    .map(p => p.toLowerCase())
    .filter(p => p.length >= 3)

  const all = (data ?? []) as { campaign_name: string; spend: number | null; leads: number | null }[]

  const matches = palavras.length === 0 ? [] : all.filter(c =>
    palavras.every(p => c.campaign_name.toLowerCase().includes(p))
  )

  const total_spend = matches.reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const total_leads = matches.reduce((s, r) => s + (Number(r.leads) || 0), 0)
  const cpl_medio   = total_leads > 0 ? Math.round((total_spend / total_leads) * 100) / 100 : null

  return NextResponse.json({ total_spend, total_leads, cpl_medio, matched_rows: matches.length })
}
