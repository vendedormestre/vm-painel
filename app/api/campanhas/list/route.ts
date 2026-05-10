import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .schema('dashboard')
    .from('meta_reports')
    .select('campanha_nome')
    .not('campanha_nome', 'is', null)
    .order('campanha_nome', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const names: string[] = [...new Set<string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data ?? []).map((r: any) => r.campanha_nome as string).filter(Boolean)
  )]

  return NextResponse.json(names)
}
