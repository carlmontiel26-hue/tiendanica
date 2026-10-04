import { createClient } from '@supabase/supabase-js'
import TiendaClient from './TiendaClient'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function generateMetadata({ params }){
  const { slug } = await params
  try{
    const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if(!store) return { title: 'Tienda' }
    const title = `${store.name} - ${store.description ? store.description.slice(0,60) : 'Ropa, Accesorios y Calzado'}`.slice(0,65)
    const description = (store.description || `Envíos en todo Paiwas`).slice(0,155)
    const image = store.cover_image || store.image_url || 'https://tiendanica.store/og-default.jpg'
    return {
      title,
      description,
      openGraph: { title, description, url: `https://tiendanica.store/${slug}`, images: [{ url: image, width: 1200, height: 630 }] }
    }
  }catch{
    return { title: 'TiendaNica.Store' }
  }
}

export default function Page({ params }){
  return <TiendaClient params={params} />
}