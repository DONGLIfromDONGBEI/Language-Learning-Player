import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Listening Player',
  description: 'English listening practice player',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

