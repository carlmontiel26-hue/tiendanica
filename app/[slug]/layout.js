import { createClient } from '@supabase/supabase-js'

function getSupabase(){
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim()
  if(!url||!key) return null
  return createClient(url,key)
}

export async function generateMetadata({ params }){
  const { slug } = await params
  try{
    const supabase = getSupabase()
    if(!supabase) throw new Error('no supabase')
    const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if(!store) return { title: 'Tienda no encontrada | TiendaNica' }
    const cover = store.cover_image || store.logo_url || store.image_url || 'https://tiendanica.store/og-default.jpg'
    const title = `${store.name} | Tienda Oficial - Compra por WhatsApp`
    const desc = store.description || `${store.name} - ${store.tipo_tienda} boutique premium en Nicaragua con envios a todo el pais.`
    
    return {
      title: title,
      description: desc,
      openGraph: {
        title: title,
        description: desc,
        url: `https://tiendanica.store/${slug}`,
        siteName: 'TiendaNica.Store',
        images: [{ url: cover, width: 1200, height: 630, alt: store.name }],
        type: 'website',
        locale: 'es_NI',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: desc,
        images: [cover],
      },
    }
  }catch(e){
    return {
      title: 'TiendaNica.Store - Tiendas Premium Nicaragua',
      description: 'Plataforma de tiendas premium que venden por WhatsApp',
    }
  }
}

export default function StoreLayout({ children }){
  return children
}
