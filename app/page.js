import { createClient } from '@supabase/supabase-js'
import MarketClient from './MarketClient'

export const revalidate = 60 // Se regenera cada 60 seg, asi entras y ya estan los productos sin "Cargando"

function getSupabase(){
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  if(!url || !key) return null
  return createClient(url, key)
}

export default async function Page(){
  const supabase = getSupabase()
  let initialProducts = []
  let initialStores = []
  if(supabase){
    try{
      const { data: stores } = await supabase.from('stores').select('*')
      initialStores = (stores||[]).filter(s=>{
        const t=(s.tipo_tienda||'').toLowerCase()
        return !t.includes('comida')
      })
      const { data: products } = await supabase.from('products')
        .select('*, stores!inner(slug,name,logo_url,tipo_tienda,whatsapp,verification_status,verification_badge,departamento,municipio)')
        .order('created_at',{ascending:false})
        .limit(200)
      initialProducts = (products||[]).filter(p=>{
        const t=(p.stores?.tipo_tienda||'').toLowerCase()
        return !t.includes('comida')
      })
    }catch(e){
      console.log('Error precarga', e)
    }
  }
  return <MarketClient initialProducts={initialProducts} initialStores={initialStores} />
}
