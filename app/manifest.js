export default function manifest() {
  return {
    name: 'TiendaNica Market - El mercado más grande de Nicaragua',
    short_name: 'TiendaNica',
    description: 'Boutique nicaragüense premium con envío nacional. Compra directo por WhatsApp.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F3',
    theme_color: '#0A0A0A',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/tienda-nica-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/tienda-nica-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
}
