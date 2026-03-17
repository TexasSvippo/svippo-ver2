import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import '@/styles/globals.scss'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}