import './globals.css'

export const metadata = {
  metadataBase: new URL('https://tiendanica.store'),
  title: {
    default: 'TiendaNica.store - El marketplace verificado de Nicaragua',
    template: '%s | TiendaNica.store',
  },
  description: 'Tiendas verificadas con video y cédula. Moda, celulares, hogar y comida. Envío a toda Nicaragua. Compra segura en TiendaNica.store',
  applicationName: 'TiendaNica.store',
  authors: [{ name: 'TiendaNica.store' }],
  creator: 'TiendaNica.store',
  publisher: 'TiendaNica.store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'TiendaNica.store - El marketplace verificado de Nicaragua',
    description: '🛡 Tiendas verificadas con video y cédula • 📦 Envío a toda Nicaragua • ⚖ Reporte antifraude 24h',
    url: 'https://tiendanica.store',
    siteName: 'TiendaNica.store',
    locale: 'es_NI',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'TiendaNica.store - Marketplace verificado Nicaragua',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TiendaNica.store - El marketplace verificado de Nicaragua',
    description: 'Tiendas verificadas con video y cédula. Envío a toda Nicaragua.',
    images: ['/opengraph-image.png'],
    creator: '@tiendanica',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  alternates: {
    canonical: 'https://tiendanica.store',
  },
}

export const viewport = {
  themeColor: '#FF8A00',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#F5F1ED' }}>{children}</body>
    </html>
  )
}
