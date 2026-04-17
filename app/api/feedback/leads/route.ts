import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

export async function POST(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_email, status } = await request.json()

  const VALID = ['novo', 'contactado', 'qualificado', 'fechado', 'descartado']
  if (!lead_email || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { error } = await adminDb()
    .schema('dashboard')
    .from('feedback_leads_b2b')
    .upsert(
      { lead_email, status, updated_at: new Date().toISOString(), updated_by: 'dashboard' },
      { onConflict: 'lead_email' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
