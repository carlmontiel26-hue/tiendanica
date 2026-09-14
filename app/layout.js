import './globals.css'
export const metadata = { 
  title: 'Tienda Nica - Tu tienda online en 5 minutos',
  description: 'Crea tu tienda online en 5 minutos. Vende por WhatsApp. Sin comisiones.',
  manifest: '/manifest.json',
  themeColor: '#00D084'
}
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#00D084" />
      </head>
      <body>{children}</body>
    </html>
  )
}
