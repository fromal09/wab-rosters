import type { Metadata } from 'next'
import './globals.css'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'WAB Roster Hub',
  description: 'Westminster Auction Baseball — Official Rosters',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
