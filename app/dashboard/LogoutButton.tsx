'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-80"
      style={{
        backgroundColor: '#1A1A1A',
        color: '#C8C7C3',
        fontFamily: 'DM Sans, sans-serif',
        border: '1px solid #2A2A2A',
      }}
    >
      Sair
    </button>
  )
}
