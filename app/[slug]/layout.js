import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function generateMetadata({ params }) {
  const slug = params?.slug
  const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()

  if (!store) return { title: 'Tienda no encontrada' }

  const cover = store.cover_image || store.image_url || 'https://tiendanica.store/logo.png'
  const title = `${store.name} - ${store.description?.slice(0,60) || 'Tienda en TiendaNica'}`
  const desc = store.description || `Compra en ${store.name} por WhatsApp. Envíos disponibles.`

  return {
    title: title,
    description: desc,
    openGraph: {
      title: store.name,
      description: desc,
      url: `https://tiendanica.store/${slug}`,
      type: 'website',
      images: [
        {
          url: cover,
          width: 1200,
          height: 630,
          alt: store.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description: desc,
      images: [cover],
    },
  }
}

export default function Layout({ children }) {
  return children
}