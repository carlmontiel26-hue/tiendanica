export default function manifest() {
  return {
    id: '/',
    name: 'TiendaNica.store',
    short_name: 'TiendaNica',
    shortName: 'TiendaNica',
    description: 'El marketplace verificado de Nicaragua - Tiendas con video y cedula, envio a toda Nicaragua',
    start_url: '/?utm_source=pwa',
    startUrl: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'browser'],
    orientation: 'portrait-primary',
    background_color: '#F5F1ED',
    backgroundColor: '#F5F1ED',
    theme_color: '#FF6A00',
    themeColor: '#FF6A00',
    lang: 'es-NI',
    categories: ['shopping', 'lifestyle', 'business'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/opengraph-image.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Marketplace verificado',
      },
    ],
    shortcuts: [
      {
        name: 'Acceso duenos',
        url: '/acceso',
        description: 'Entra rapido a tu tienda',
      },
    ],
  }
}
