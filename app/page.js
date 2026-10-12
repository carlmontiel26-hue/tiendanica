import { createClient } from '@supabase/supabase-js'

export const revalidate = 60

function getSupabase(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export const metadata = {
  title: 'TiendaNica Market - El mercado más grande de Nicaragua',
  description: 'Boutique, comida y productos generales. Compra directo por WhatsApp.',
}

export default async function Page(){
  const supabase = getSupabase()
  const { data: stores } = await supabase.from('stores').select('id,name,slug,logo_url,cover_image,tipo_tienda,whatsapp').order('created_at',{ascending:false})
  const { data: products } = await supabase.from('products').select('id,store_id,name,price,image_url,categoria').eq('is_active',true).order('created_at',{ascending:false}).limit(200)

  const map={}
  stores?.forEach(s=>map[s.id]=s)
  const list = (products||[]).map(p=>({...p,_store:map[p.store_id]})).filter(x=>x._store)

  return (
    <main style={{background:'#F7F5F3', minHeight:'100vh', padding:14, fontFamily:'Inter,system-ui'}}>
      <div style={{maxWidth:1120, margin:'0 auto'}}>
        <h1 style={{fontWeight:900, fontSize:20}}>👜 TiendaNica Market • {stores?.length||0} tiendas • {list.length} productos</h1>
        <p style={{fontSize:12, color:'#888', marginTop:4}}>Esto ya lo ve Google en el HTML puro - fix SEO</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginTop:16}}>
          {list.map(p=>(
            <div key={p.id} style={{background:'#fff', borderRadius:16, padding:10, border:'1px solid #EAE6E1'}}>
              <img src={p.image_url} alt={`${p.name} - ${p._store.name}`} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:12}}/>
              <b style={{fontSize:12, display:'block', marginTop:6}}>{p.name}</b>
              <span style={{fontSize:10, color:'#888'}}>{p._store.name}</span>
              <div style={{marginTop:6, fontWeight:800}}>C$ {p.price}</div>
              <a href={`/${p._store.slug}`} style={{fontSize:11, color:'#00D084', textDecoration:'none'}}>Ver en {p._store.slug}</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}