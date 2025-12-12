import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Spectra - Your Entertainment Curator',
  description: 'Get personalized movie, book, and music recommendations',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body 
        className={`font-sans antialiased ${geist.className} ${geistMono.className} ${spaceGrotesk.variable}`}
        suppressHydrationWarning
      >
        {children}
        <Analytics /> 
      </body>
    </html>
  )
}
