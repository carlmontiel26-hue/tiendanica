import './globals.css'

export const viewport = {
  themeColor: '#6D28D9',
}

export const metadata = {
  title: 'TN Sistemas - POS',
  description: 'TN Sistemas POS - Ventas offline, cierres y tickets WhatsApp.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
