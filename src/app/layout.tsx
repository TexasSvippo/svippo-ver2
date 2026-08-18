import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import '@/styles/globals.scss'

export const metadata: Metadata = {
  metadataBase: new URL('https://svippo-ver2.vercel.app'),
  openGraph: {
    images: ['/images/Svippo-og-img.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <Navbar />
        <ScrollToTop />
        {children}
        <Footer />
      </body>
    </html>
  )
}