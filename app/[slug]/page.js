import { createClient } from '@supabase/supabase-js'
import TiendaClient from './TiendaClient'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function generateMetadata({ params }){
  const slug = params?.slug
  try{
    const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if(!store) return { title: 'Tienda' }
    
    const title = `${store.name} - ${store.description ? store.description.slice(0,60) : 'Ropa, Accesorios y Calzado'}`.slice(0,65)
    const description = (store.description || `Envíos en todo Paiwas. Pide por WhatsApp ${store.whatsapp || ''}`).slice(0,155)
    const image = store.cover_image || store.image_url || 'https://tiendanica.store/og-default.jpg'
    const url = `https://tiendanica.store/${store.slug}`

    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: url,
        type: 'website',
        siteName: 'TiendaNica.Store',
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: store.name,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [image],
      }
    }
  }catch(e){
    return { title: 'TiendaNica.Store' }
  }
}

export default function Page({ params }){
  return <TiendaClient slug={params?.slug} />
}
