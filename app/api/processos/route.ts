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

  const { cargo, empresa, vagas_abertas, meta_contratacoes } = await request.json()

  if (!cargo || !empresa) {
    return NextResponse.json({ error: 'Cargo e empresa são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await adminDb()
    .schema('dashboard')
    .from('processos_seletivos')
    .insert({
      cargo,
      empresa,
      status: 'ativo',
      vagas_abertas: vagas_abertas ?? null,
      meta_contratacoes: meta_contratacoes ?? null,
      data_inicio: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
