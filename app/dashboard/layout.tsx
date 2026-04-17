import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get('vm_session')
  if (!session || session.value !== 'authenticated') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F4F2' }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <span
          className="text-lg"
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#F5F4F2' }}
        >
          Vendedor Mestre
        </span>
        <LogoutButton />
      </header>

      <main className="flex-1 pt-16">{children}</main>
    </div>
  )
}
