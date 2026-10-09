import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

export async function generateMetadata({ params }){
  const { slug } = await params
  const supabase = getSupabase()
  if(!supabase) return {}
  const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()
  if(!store){
    return {
      title: 'Tienda no encontrada - TiendaNica',
      description: 'Esta tienda no existe en TiendaNica Market'
    }
  }
  const tipoIcon = store.tipo_tienda==='comida'?'🍔': store.tipo_tienda==='general'?'🛍️':'👗'
  const title = `${store.name} ${tipoIcon} - en TiendaNica Market`
  const desc = store.description || `Compra en ${store.name} por WhatsApp directo al dueño. ${store.tipo_tienda==='comida'?'Comida a domicilio premium': store.tipo_tienda==='general'?'Todo para tu hogar':'Boutique nicaragüense premium'} en TiendaNica Market.`

  return {
    title,
    description: desc,
    metadataBase: new URL('https://tiendanica.store'),
    openGraph: {
      title,
      description: desc,
      url: `https://tiendanica.store/${store.slug}`,
      siteName: 'TiendaNica Market',
      images: [
        {
          url: store.logo_url || store.cover_image || '/tienda-nica-logo-og.png',
          width: 800,
          height: 800,
          alt: store.name,
        },
        {
          url: store.cover_image || store.logo_url || '/tienda-nica-logo-og.png',
          width: 1200,
          height: 630,
          alt: `${store.name} portada`,
        }
      ],
      locale: 'es_NI',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [store.logo_url || store.cover_image || '/tienda-nica-logo-og.png'],
    },
  }
}

// IMPORTA TU PAGINA REAL AQUI ABAJO - deja tu app/[slug]/page.js como estaba, solo añade el generateMetadata arriba
// Si tu page.js actual es 'use client', crea este archivo como app/[slug]/layout.js con solo el generateMetadata
// y deja tu page.js intacto. Next.js combinará ambos.
export default function StoreLayout({ children }){
  return <>{children}</>
}
