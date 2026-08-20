import type { Metadata } from 'next'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import '@/styles/globals.scss'

const GTM_ID = 'GTM-5WH6KB3S'

export const metadata: Metadata = {
  metadataBase: new URL('https://svippo.se'),
  openGraph: {
    images: ['/images/Svippo-og-img.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/*
          TODO(consent): GTM laddas här utan Google Consent Mode eller någon
          cookie-samtyckeslösning -- medvetet, för att kopplas in separat.
          Innan detta är GDPR-kompatibelt behöver ett samtyckeslager finnas
          (t.ex. gtag('consent', 'default', { analytics_storage: 'denied', ... })
          satt FÖRE detta script, eller en CMP som styr GTM-triggers) så att
          taggar som sätter cookies inte kan fyra förrän besökaren samtyckt.
        */}
        <Script id="gtm-head" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>

        <Navbar />
        <ScrollToTop />
        {children}
        <Footer />
      </body>
    </html>
  )
}