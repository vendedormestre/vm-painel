import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

export async function POST() {
  const supabase = createAdminClient()

  // Fetch all non-null cargo+empresa pairs from public.aplicacao
  const { data: rows, error: fetchError } = await supabase
    .from('aplicacao')
    .select('cargo, empresa')
    .not('cargo', 'is', null)
    .not('empresa', 'is', null)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  // Deduplicate in JS
  const seen = new Set<string>()
  const records: { cargo: string; empresa: string; status: string; data_inicio: string }[] = []
  for (const row of rows ?? []) {
    const key = `${row.cargo}|${row.empresa}`
    if (!seen.has(key)) {
      seen.add(key)
      records.push({
        cargo: row.cargo as string,
        empresa: row.empresa as string,
        status: 'ativo',
        data_inicio: new Date().toISOString().split('T')[0],
      })
    }
  }

  if (records.length === 0) return NextResponse.json({ synced: 0 })

  // Upsert — ON CONFLICT (cargo, empresa) DO NOTHING
  const { error: upsertError } = await adminDb()
    .schema('dashboard')
    .from('processos_seletivos')
    .upsert(records, { onConflict: 'cargo,empresa', ignoreDuplicates: true })

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ synced: records.length })
}
