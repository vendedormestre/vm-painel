export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F3F1' }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: '#0D0B0A' }}
      >
        <span
          className="text-lg"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: '#F4F3F1' }}
        >
          Vendedor Mestre
        </span>
      </header>

      <main className="flex-1 pt-16">{children}</main>
    </div>
  )
}
