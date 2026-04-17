'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError('Senha incorreta')
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div className="w-full max-w-sm px-8 py-10 flex flex-col items-center gap-8">
        <h1
          className="text-2xl tracking-tight"
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#F5F4F2' }}
        >
          Vendedor Mestre
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-md text-sm outline-none"
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #2A2A2A',
              color: '#F5F4F2',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />

          {error && (
            <p
              className="text-sm text-center"
              style={{ color: '#D4001F', fontFamily: 'DM Sans, sans-serif' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md text-sm font-medium transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: '#D4001F',
              color: '#F5F4F2',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
