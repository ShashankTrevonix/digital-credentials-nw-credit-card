import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NatWest Credit Card Application - Digital ID Verification',
  description: 'Apply for your NatWest credit card using secure digital identity verification. Complete your application in minutes with verified credentials.',
  manifest: '/favicon_io/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon_io/favicon.ico', sizes: 'any' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
        <html lang="en">
          <head>
            <link rel="icon" href="/favicon_io/favicon.ico" sizes="any" />
            <link rel="icon" href="/favicon_io/favicon-16x16.png" sizes="16x16" type="image/png" />
            <link rel="icon" href="/favicon_io/favicon-32x32.png" sizes="32x32" type="image/png" />
            <link rel="apple-touch-icon" href="/favicon_io/apple-touch-icon.png" />
            <link rel="manifest" href="/favicon_io/site.webmanifest" />
          </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
