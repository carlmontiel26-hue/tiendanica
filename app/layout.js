import './globals.css'

export const viewport = {
  themeColor: '#0A0A0A',
}

export const metadata = {
  title: 'TiendaNica Market - El mercado más grande de Nicaragua',
  description: 'Boutique nicaragüense premium con envío a toda Nicaragua. Compra directo por WhatsApp al dueño.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TiendaNica',
  },
  icons: {
    icon: '/tienda-nica-logo.png',
    apple: '/tienda-nica-logo.png',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
