import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OnTheWay - Onboarding Made Simple',
  description: 'Create beautiful product tours in minutes',
  icons: {
    icon: '/favicon.svg',
  },
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
