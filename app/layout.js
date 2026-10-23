import './globals.css'

export const viewport = {
  themeColor: '#F7F5F3',
}

export const metadata = {
  title: 'TiendaNica.store - Tiendas verificadas con video y cédula',
  description: 'Marketplace verificado de Nicaragua: boutique, general y más. Compra directo por WhatsApp al dueño, envío a toda Nicaragua y reporte antifraude 24h.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/tienda-nica-logo.png', sizes: 'any', type: 'image/png' }
    ],
    apple: '/tienda-nica-logo.png',
  },
  openGraph: {
    title: 'TiendaNica.store - Tiendas verificadas con video y cédula',
    description: 'Marketplace verificado de Nicaragua. Boutique y general con envío a toda Nicaragua y reporte antifraude 24h.',
    url: 'https://tiendanica.store',
    siteName: 'TiendaNica',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'TiendaNica.store',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TiendaNica.store',
    description: 'Tiendas verificadas con video y cédula - Marketplace de Nicaragua',
    images: ['/opengraph-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TiendaNica',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
