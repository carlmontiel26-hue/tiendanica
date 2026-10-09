import './globals.css'

export const metadata = {
  title: 'TiendaNica Market - El mercado más grande de Nicaragua',
  description: 'Boutique, comida y todo para tu hogar en un solo lugar. Compra directo por WhatsApp al dueño. 4 tiendas reales, 100% nicaragüense.',
  metadataBase: new URL('https://tiendanica.store'),
  openGraph: {
    title: 'TiendaNica Market 🛍️🇳🇮',
    description: 'Boutique, comida y electrodomésticos de tus tiendas favoritas. Compra directa por WhatsApp al dueño. ¡Únete al mercado nica!',
    url: 'https://tiendanica.store',
    siteName: 'TiendaNica',
    images: [
      {
        url: '/tienda-nica-logo-og.png', // 1200x630 px ideal para WhatsApp
        width: 1200,
        height: 630,
        alt: 'TiendaNica Market - Mercado Nicaragüense Premium',
      },
    ],
    locale: 'es_NI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TiendaNica Market - Boutique, Comida y Más',
    description: 'El mercado nica premium. Compra por WhatsApp directo al dueño.',
    images: ['/tienda-nica-logo-og.png'],
  },
  icons: {
    icon: '/tienda-nica-logo.png',
    apple: '/tienda-nica-logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
