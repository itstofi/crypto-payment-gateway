import Link from 'next/link'

interface HeaderProps {
  activePage?: 'payment' | 'admin'
}

export function Header({ activePage }: HeaderProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-white text-sm tracking-tight">
          Crypto Gateway
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm transition-colors ${
              activePage === 'payment' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Payment
          </Link>
          <Link
            href="/admin"
            className={`text-sm transition-colors ${
              activePage === 'admin' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
