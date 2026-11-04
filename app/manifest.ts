import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'TiendaNica.store',
    shortName: 'TiendaNica',
    description: 'El marketplace verificado de Nicaragua - Tiendas con video y cédula, envío a toda Nicaragua',
    startUrl: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    displayOverride: ['window-controls-overlay', 'standalone', 'browser'],
    orientation: 'portrait-primary',
    backgroundColor: '#F5F1ED',
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
        formFactor: 'wide',
        label: 'Marketplace verificado',
      },
    ],
    shortcuts: [
      {
        name: 'Acceso dueños',
        url: '/acceso',
        description: 'Entra rápido a tu tienda',
      },
    ],
  }
}
