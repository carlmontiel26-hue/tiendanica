import { createClient } from '@supabase/supabase-js'
import MarketClient from './MarketClient'

export const revalidate = 60

function getSupabase(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export const metadata = {
  title: 'TiendaNica Market - El mercado más grande de Nicaragua',
  description: 'Boutique nicaragüense premium, comida y productos generales. Compra directo por WhatsApp.',
}

export default async function Page(){
  const supabase = getSupabase()
  const { data: stores } = await supabase.from('stores').select('id,name,slug,logo_url,cover_image,tipo_tienda,whatsapp').order('created_at',{ascending:false})
  const { data: products } = await supabase.from('products').select('id,store_id,name,price,image_url,categoria').eq('is_active',true).order('created_at',{ascending:false}).limit(200)

  const map={}
  stores?.forEach(s=>map[s.id]=s)
  const enriched = (products||[]).map(p=>({...p,_store:map[p.store_id]})).filter(x=>x._store)

  return <MarketClient initialStores={stores||[]} initialProducts={enriched} />
}