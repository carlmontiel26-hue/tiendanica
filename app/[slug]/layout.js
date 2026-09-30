import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function generateMetadata({ params }) {
  const slug = params?.slug
  const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()

  if (!store) return { title: 'Tienda no encontrada' }

  const cover = store.cover_image || store.image_url || 'https://tiendanica.store/logo.png'
  // WhatsApp corta título a 60-65 caracteres, descripción a 155
  const title = `${store.name} - ${store.description?.slice(0,50) || 'Ropa, Accesorios y Calzado'}`.slice(0,65)
  const desc = (store.description || `Envíos en todo Paiwas. Pide por WhatsApp ${store.whatsapp || ''}. Compra en ${store.name}`).slice(0,155)

  return {
    metadataBase: new URL('https://tiendanica.store'),
    title: title,
    description: desc,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: store.name,
      description: desc,
      url: `https://tiendanica.store/${slug}`,
      siteName: 'TiendaNica.Store',
      type: 'website',
      locale: 'es_NI',
      images: [
        {
          url: cover,
          secureUrl: cover,
          width: 1200,
          height: 630,
          alt: store.name,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description: desc,
      images: [cover],
    },
    // WhatsApp usa estos también si están
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
    }
  }
}

export default function Layout({ children }) {
  return children
}
