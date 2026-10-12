import './globals.css'

export const viewport = {
  themeColor: '#F7F5F3',
}

export const metadata = {
  title: 'TiendaNica Market - El mercado más grande de Nicaragua',
  description: 'Boutique nicaragüense premium con envío a toda Nicaragua. Compra directo por WhatsApp al dueño.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/tienda-nica-logo.png', sizes: 'any', type: 'image/png' }
    ],
    apple: '/tienda-nica-logo.png',
  },
  openGraph: {
    title: 'TiendaNica Market - El mercado más grande de Nicaragua',
    description: 'Boutique nicaragüense premium con envío a toda Nicaragua.',
    url: 'https://tiendanica.store',
    siteName: 'TiendaNica',
    images: [
      {
        url: '/tienda-nica-logo-og.png',
        width: 1200,
        height: 630,
        alt: 'TiendaNica Market',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TiendaNica Market',
    description: 'Boutique nicaragüense premium',
    images: ['/tienda-nica-logo-og.png'],
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