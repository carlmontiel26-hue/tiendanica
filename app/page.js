import { createClient } from '@supabase/supabase-js'
import MarketClient from './MarketClient'

export const revalidate = 60

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key)
}

export const metadata = {
  title: 'TiendaNica Market - El mercado más grande de Nicaragua',
  description: 'Boutique nicaragüense premium, comida y productos generales. 3 tiendas, 102 productos. Compra directo por WhatsApp al dueño sin comisiones en tiendanica.store',
  openGraph: {
    title: 'TiendaNica Market',
    description: 'El mercado nicaragüense con compra directa por WhatsApp',
    url: 'https://tiendanica.store',
    siteName: 'TiendaNica Market',
    images: [{ url: '/tienda-nica-logo.png', width: 800, height: 600 }],
    locale: 'es_NI',
    type: 'website',
  }
}

export default async function Page(){
  const supabase = getSupabase()

  // ESTO ES LO QUE VE GOOGLE - HTML PURO
  const { data: stores } = await supabase.from('stores').select('id,name,slug,logo_url,cover_image,tipo_tienda,whatsapp').order('created_at',{ascending:false})
  const { data: products } = await supabase.from('products').select('id,store_id,name,price,image_url,categoria').eq('is_active',true).order('created_at',{ascending:false}).limit(200)

  const storeMap={}
  stores?.forEach(s=>storeMap[s.id]=s)
  const enriched = (products||[]).map(p=> ({...p, _store: storeMap[p.store_id]})).filter(x=>x._store)

  return <MarketClient initialStores={stores||[]} initialProducts={enriched} />
}
